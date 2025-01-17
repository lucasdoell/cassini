package main

import (
	"log"
	"net/http"
	"os"

	"github.com/lucasdoell/cassini/backend/analytics"
	"github.com/lucasdoell/cassini/backend/observability"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	http.HandleFunc("/analytics", analytics.AnalyticsHandler)
	http.HandleFunc("/observability", observability.ObservabilityHandler)

	log.Printf("Starting debug server on port %s...\n", port)
	log.Printf("Send analytics events to http://localhost:%s/analytics\n", port)
	log.Printf("Send observability data to http://localhost:%s/observability\n", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
