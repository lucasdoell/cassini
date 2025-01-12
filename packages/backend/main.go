package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// Pretty print JSON with indentation
func prettyPrint(data map[string]interface{}) {
	output, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error formatting JSON: %v\n", err)
		return
	}
	fmt.Printf("\n%s\n", string(output))
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func analyticsHandler(w http.ResponseWriter, r *http.Request) {
	// Log basic request info
	log.Printf("Received %s request from %s\n", r.Method, r.RemoteAddr)
	log.Printf("User-Agent: %s\n", r.Header.Get("User-Agent"))

	// Set CORS headers for all responses
	setCORSHeaders(w)

	// Handle preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only proceed with body parsing for POST requests
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading body: %v\n", err)
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}

	// Check if body is empty
	if len(body) == 0 {
		log.Printf("Empty request body received\n")
		http.Error(w, "Empty request body", http.StatusBadRequest)
		return
	}

	// Parse JSON
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		log.Printf("Error parsing JSON: %v\n", err)
		http.Error(w, "Error parsing JSON", http.StatusBadRequest)
		return
	}

	// Add timestamp
	log.Printf("\n=== Analytics Event Received at %s ===\n", time.Now().Format(time.RFC3339))

	// Pretty print the JSON data
	prettyPrint(data)

	// Respond with success
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	http.HandleFunc("/analytics", analyticsHandler)

	log.Printf("Starting debug analytics server on port %s...\n", port)
	log.Printf("Send analytics events to http://localhost:%s/analytics\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
