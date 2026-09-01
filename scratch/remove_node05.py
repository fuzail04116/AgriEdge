import os

files_to_edit_node05 = [
    r"d:\AgriEdge\simulator\run_simulator.py",
    r"d:\AgriEdge\dashboard\src\panels\SensorMonitoring.jsx",
    r"d:\AgriEdge\dashboard\src\panels\GasSignature.jsx",
    r"d:\AgriEdge\dashboard\src\panels\FusionRisk.jsx",
    r"d:\AgriEdge\dashboard\src\components\SensorCharts.jsx",
    r"d:\AgriEdge\backend\api\main.py"
]

for file_path in files_to_edit_node05:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace the arrays containing node-05 and cam-05
        content = content.replace(
            '["node-01", "node-02", "node-03", "node-04", "node-05"]',
            '["node-01", "node-02", "node-03", "node-04"]'
        )
        content = content.replace(
            "['node-01', 'node-02', 'node-03', 'node-04', 'node-05']",
            "['node-01', 'node-02', 'node-03', 'node-04']"
        )
        content = content.replace(
            '["cam-01", "cam-02", "cam-03", "cam-04", "cam-05"]',
            '["cam-01", "cam-02", "cam-03", "cam-04"]'
        )

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file_path}")

