package observability

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

func prettyPrint(data map[string]interface{}) {
	output, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error formatting JSON: %v\n", err)
		return
	}
	fmt.Printf("\n%s\n", string(output))
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

func ObservabilityHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received %s request from %s\n", r.Method, r.RemoteAddr)
	log.Printf("User-Agent: %s\n", r.Header.Get("User-Agent"))
	log.Printf("Origin: %s\n", r.Header.Get("Origin"))

	setCORSHeaders(w, r)

	// Only proceed with body parsing for POST requests
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

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		log.Printf("Error parsing JSON: %v\n", err)
		http.Error(w, "Error parsing JSON", http.StatusBadRequest)
		return
	}

	log.Printf("\n=== Observability Event Received at %s ===\n", time.Now().Format(time.RFC3339))

	prettyPrint(data)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
