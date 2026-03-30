"""
Script to fix plc_to_spl.py - removes duplicate function definition
"""
import re

# Read the original file
with open('c:/Users/Admin/Downloads/FactoryEYE-main/SearchEngine/src/plc_to_spl.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove the duplicate function definition
# The pattern is: def acquisition_loop_simulation(): ... until next def or end
# We need to find and remove the second occurrence

# Split by the function definition
parts = content.split('def acquisition_loop_simulation():')

# Keep only the first occurrence (index 0) and everything after the second occurrence
if len(parts) >= 3:
    # parts[0] = everything before first def
    # parts[1] = first function body  
    # parts[2] = second function body and rest
    
    # Find where the second function starts (after the first one ends)
    # Look for the pattern: except Exception: ... time.sleep(INTERVAL_S)
    # Then followed by # ============================= and def vib_metrics
    
    # Let's reconstruct: first part + second part (which has the acquisition_loop and duplicate)
    # We need to keep everything up to the first function end, then add the rest
    
    # Find the end of the first acquisition_loop_simulation function
    # It ends before "def acquisition_loop():" which is the main loop
    
    # Find position of second "def acquisition_loop_simulation"
    # and keep only up to there
    
    first_end = content.find('# =============================\n# ACQUISITION THREAD')
    
    if first_end > 0:
        # Find the start of second duplicate
        second_start = content.find('def acquisition_loop_simulation():', first_end)
        
        if second_start > 0:
            # Find where this duplicate ends (before vib_metrics)
            second_end = content.find('# =============================\n# API')
            
            if second_end > 0:
                # Remove the duplicate
                new_content = content[:second_start] + content[second_end:]
                
                # Write back
                with open('c:/Users/Admin/Downloads/FactoryEYE-main/SearchEngine/src/plc_to_spl.py', 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print("Fixed! Duplicate function removed.")
            else:
                print("Could not find end of duplicate")
        else:
            print("Could not find second duplicate")
    else:
        print("Could not find ACQUISITION THREAD section")
else:
    print("Not enough parts to fix")

print("Done")

