
filename = 'src/data/wordPairs.ts'
try:
    with open(filename, 'r') as f:
        content = f.read()
        
    open_curly = content.count('{')
    close_curly = content.count('}')
    open_square = content.count('[')
    close_square = content.count(']')
    
    print(f"File: {filename}")
    print(f"Length: {len(content)} chars")
    print(f"Lines: {len(content.splitlines())}")
    print(f"{{ : {open_curly}, }} : {close_curly}")
    print(f"[ : {open_square}, ] : {close_square}")
    
    if open_curly != close_curly:
        print("MISMATCH: Curly braces!")
    if open_square != close_square:
        print("MISMATCH: Square brackets!")
        
except Exception as e:
    print(f"Error: {e}")
