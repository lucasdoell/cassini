package observability

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// StructuredLog matches the TypeScript interface from logging.ts
type StructuredLog struct {
	Type      string           `json:"type"`
	Timestamp string           `json:"timestamp"`
	Level     string           `json:"level"`
	Message   string           `json:"message"`
	Service   string           `json:"service"`
	Metadata  *json.RawMessage `json:"metadata,omitempty"`
	Error     *struct {
		Name    string `json:"name"`
		Message string `json:"message"`
		Stack   string `json:"stack,omitempty"`
	} `json:"error,omitempty"`
	TraceID string `json:"traceId,omitempty"`
	SpanID  string `json:"spanId,omitempty"`
}

type ResourceSpans struct {
	ResourceSpans []struct {
		Resource struct {
			Attributes []struct {
				Key   string `json:"key"`
				Value struct {
					StringValue string `json:"stringValue,omitempty"`
					IntValue    int64  `json:"intValue,omitempty"`
					BoolValue   bool   `json:"boolValue,omitempty"`
				} `json:"value"`
			} `json:"attributes"`
			DroppedAttributesCount uint32 `json:"droppedAttributesCount"`
		} `json:"resource"`
		ScopeSpans []struct {
			Scope struct {
				Name    string `json:"name"`
				Version string `json:"version,omitempty"`
			} `json:"scope"`
			Spans []struct {
				TraceID           string `json:"traceId"`
				SpanID            string `json:"spanId"`
				ParentSpanId      string `json:"parentSpanId,omitempty"`
				Name              string `json:"name"`
				Kind              int    `json:"kind"`
				StartTimeUnixNano string `json:"startTimeUnixNano"`
				EndTimeUnixNano   string `json:"endTimeUnixNano"`
				Attributes        []struct {
					Key   string `json:"key"`
					Value struct {
						StringValue string `json:"stringValue,omitempty"`
						IntValue    int64  `json:"intValue,omitempty"`
						BoolValue   bool   `json:"boolValue,omitempty"`
					} `json:"value"`
				} `json:"attributes"`
				Status struct {
					Code    int    `json:"code"`
					Message string `json:"message,omitempty"`
				} `json:"status"`
				Events                 []json.RawMessage `json:"events"`
				Links                  []json.RawMessage `json:"links"`
				DroppedAttributesCount uint32            `json:"droppedAttributesCount"`
				DroppedEventsCount     uint32            `json:"droppedEventsCount"`
				DroppedLinksCount      uint32            `json:"droppedLinksCount"`
			} `json:"spans"`
		} `json:"scopeSpans"`
	} `json:"resourceSpans"`
}

func processStructuredLog(log StructuredLog) error {
	fmt.Printf("Processing structured log: %s - %s\n", log.Level, log.Message)
	return nil
}

func processOTLPSpans(spans ResourceSpans) error {
	for _, rs := range spans.ResourceSpans {
		fmt.Println("\n=== Resource ===")
		// Pretty print resource attributes
		fmt.Println("Resource Attributes:")
		for _, attr := range rs.Resource.Attributes {
			val := attr.Value
			var valueStr string
			switch {
			case val.StringValue != "":
				valueStr = val.StringValue
			case val.IntValue != 0:
				valueStr = fmt.Sprintf("%d", val.IntValue)
			case val.BoolValue:
				valueStr = fmt.Sprintf("%v", val.BoolValue)
			}
			fmt.Printf("  %s: %s\n", attr.Key, valueStr)
		}

		for _, ss := range rs.ScopeSpans {
			scopeName := ss.Scope.Name
			if scopeName == "" {
				scopeName = "unnamed"
			}
			if ss.Scope.Version != "" {
				fmt.Printf("\n=== Scope: %s (Version: %s) ===\n", scopeName, ss.Scope.Version)
			} else {
				fmt.Printf("\n=== Scope: %s ===\n", scopeName)
			}

			for _, span := range ss.Spans {
				fmt.Printf("\nSpan: %s\n", span.Name)
				fmt.Printf("  TraceID: %s\n", span.TraceID)
				fmt.Printf("  SpanID: %s\n", span.SpanID)
				if span.ParentSpanId != "" {
					fmt.Printf("  ParentSpanID: %s\n", span.ParentSpanId)
				}
				fmt.Printf("  Kind: %d\n", span.Kind)
				fmt.Printf("  Start Time: %s\n", span.StartTimeUnixNano)
				fmt.Printf("  End Time: %s\n", span.EndTimeUnixNano)
				fmt.Printf("  Status Code: %d\n", span.Status.Code)
				if span.Status.Message != "" {
					fmt.Printf("  Status Message: %s\n", span.Status.Message)
				}

				if len(span.Attributes) > 0 {
					fmt.Println("  Attributes:")
					for _, attr := range span.Attributes {
						val := attr.Value
						var valueStr string
						switch {
						case val.StringValue != "":
							valueStr = val.StringValue
						case val.IntValue != 0:
							valueStr = fmt.Sprintf("%d", val.IntValue)
						default:
							valueStr = fmt.Sprintf("%v", val.BoolValue)
						}
						fmt.Printf("    %s: %s\n", attr.Key, valueStr)
					}
				}

				if span.DroppedAttributesCount > 0 {
					fmt.Printf("  Dropped Attributes: %d\n", span.DroppedAttributesCount)
				}
				if span.DroppedEventsCount > 0 {
					fmt.Printf("  Dropped Events: %d\n", span.DroppedEventsCount)
				}
				if span.DroppedLinksCount > 0 {
					fmt.Printf("  Dropped Links: %d\n", span.DroppedLinksCount)
				}

				// Pretty print events if they exist
				if len(span.Events) > 0 {
					fmt.Println("  Events:")
					for _, event := range span.Events {
						eventJSON, _ := json.MarshalIndent(event, "    ", "  ")
						fmt.Printf("    %s\n", string(eventJSON))
					}
				}

				// Pretty print links if they exist
				if len(span.Links) > 0 {
					fmt.Println("  Links:")
					for _, link := range span.Links {
						linkJSON, _ := json.MarshalIndent(link, "    ", "  ")
						fmt.Printf("    %s\n", string(linkJSON))
					}
				}
			}
		}
	}
	return nil
}

func ObservabilityHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received %s request from %s\n", r.Method, r.RemoteAddr)
	log.Printf("User-Agent: %s\n", r.Header.Get("User-Agent"))
	log.Printf("Origin: %s\n", r.Header.Get("Origin"))

	setCORSHeaders(w, r)

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading body: %v\n", err)
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}

	log.Printf("\n=== Observability Event Received at %s ===\n", time.Now().Format(time.RFC3339))

	var rawData map[string]interface{}
	if err := json.Unmarshal(body, &rawData); err != nil {
		log.Printf("Error parsing JSON: %v\n", err)
		http.Error(w, "Error parsing JSON", http.StatusBadRequest)
		return
	}

	prettyPrint(rawData)

	// Process based on the type field
	if typeStr, ok := rawData["type"].(string); ok && typeStr == "structured_log" {
		var structLog StructuredLog
		if err := json.Unmarshal(body, &structLog); err != nil {
			log.Printf("Error parsing structured log: %v\n", err)
			http.Error(w, "Error parsing structured log", http.StatusBadRequest)
			return
		}

		if err := processStructuredLog(structLog); err != nil {
			log.Printf("Error processing structured log: %v\n", err)
			http.Error(w, "Error processing structured log", http.StatusInternalServerError)
			return
		}
	} else if _, ok := rawData["resourceSpans"]; ok {
		var spans ResourceSpans
		if err := json.Unmarshal(body, &spans); err != nil {
			log.Printf("Error parsing OTLP spans: %v\n", err)
			http.Error(w, "Error parsing OTLP spans", http.StatusBadRequest)
			return
		}

		if err := processOTLPSpans(spans); err != nil {
			log.Printf("Error processing OTLP spans: %v\n", err)
			http.Error(w, "Error processing OTLP spans", http.StatusInternalServerError)
			return
		}
	} else {
		log.Printf("Unknown data type received\n")
		http.Error(w, "Unknown data type", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	}
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

func prettyPrint(data map[string]interface{}) {
	output, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error formatting JSON: %v\n", err)
		return
	}
	fmt.Printf("\n%s\n", string(output))
}
