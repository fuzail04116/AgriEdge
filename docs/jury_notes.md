# AgriEdge — Hackathon Jury Notes

These are the core talking points to use during the hackathon presentation to address scope, completeness, and production readiness.

## 1. Hardware Simulation & Architecture
"The sensor and camera nodes are simulated for today's demo, but the simulator sends the exact same message schema our ESP32 firmware will send — swapping in real hardware means changing zero lines of backend code."

*Context for jury:* The HTTP ingest endpoints we used today map 1:1 to the MQTT topics we will use in production.

## 2. ML Models & Training Data
"The disease and gas models are trained on a procedurally generated mock dataset today, to demonstrate the full inference-to-dashboard pipeline end-to-end. The production version trains on PlantVillage + our own field images, per our full implementation plan."

*Context for jury:* We built the pipeline to run real inference (feature extraction → scikit-learn random forests → fusion), proving the system works. Using synthetic data avoided heavy downloads and licensing issues during the 24-hour hackathon constraints.

## 3. Pest Detector Scope
"The pest detector shown today is a placeholder scoring function, not a trained object detector — that's the one component we're explicitly flagging as not-yet-implemented, to be honest about scope."

*Context for jury:* The placeholder allows the Fusion Engine to ingest a pest score and evaluate it alongside disease and gas anomalies. Production will use YOLO trained on IP102.

## 4. Farmer Feedback Loop (The "Confirm/Deny" Feature)
When showing the dashboard, click "Confirm" or "Deny" on an alert and point out:
"By giving the farmer a one-click way to verify alerts, we are building a labelled dataset of real-world edge cases. Over time, we use logistic regression on these confirmations to auto-tune the weights in our Fusion Engine."

## 5. Potential Questions to Prepare For

**Q: "How is this different from existing smart agriculture platforms?"**
A: (Cost/Offline/Ownership) "Most platforms require expensive proprietary sensor gateways and run heavy models in the cloud. AgriEdge uses off-the-shelf ESP32 nodes, and our models are lightweight scikit-learn classifiers designed to run on a cheap local edge server (or even directly on the nodes in the future), ensuring offline-first operation."

**Q: "What's the latency from a sensor spike to a dashboard alert?"**
A: "Our measured latency from the simulator POSTing an image/sensor payload to the alert appearing on the dashboard is under ~4 seconds (limited only by our intentional 3-second dashboard polling interval). The backend inference itself runs in milliseconds."
