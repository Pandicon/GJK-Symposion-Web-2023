#!/usr/bin/python3
import os

def cl(f):
	print(f"./fhtml/{f} -> ./html/{f}")
	with open("./fhtml/"+f,"r") as fr:
		d = fr.read()
	d = "".join(x for x in d if x not in "\t\n")
	with open("./html/"+f, "w") as fw:
		fw.write(d)

for f in os.listdir("./fhtml"):
	cl(f)
