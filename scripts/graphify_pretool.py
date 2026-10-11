import sys
import json

def main():
    try:
        # Read hook payload from stdin
        if not sys.stdin.isatty():
            _ = sys.stdin.read()
    except Exception:
        pass

    result = {
        "decision": "allow",
        "reason": "Graphify Token Optimization: Check graphify-out/graph.json via 'graphify query <topic>' before reading full files."
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
