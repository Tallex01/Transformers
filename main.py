from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
import re
import torch
import torch.nn as nn

app = FastAPI()

#start with a vocabulary
vocab = [" ", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

vocab_dictionary = {}
counter = 0
for char in vocab:
    vocab_dictionary[char] = counter
    counter += 1

#takes string but puts it in only a format with letters in the vocab
#any char not in dic, replace with " "
def normalize(string: str):    
    for char in string:
        if char not in vocab:
            string = string.replace(char, " ")
    return re.sub(r'\s+', ' ', string)

embedding = nn.Embedding(27,2)    #27 words, 2 dim. Embedding is a function


@app.get("/vocab")
def get_vocab():
    return vocab_dictionary   

@app.get("/encode/{word}")
def encode_char(word: str):
    encoded = []
    for c in normalize(word):
        encoded.append(vocab_dictionary[c])
    return encoded

@app.get('/embed')
def embed(char: str):
    index = vocab_dictionary[char]
    vector = embedding(torch.tensor(index))
    return vector.tolist()









app.mount("/", StaticFiles(directory="static", html=True), name="static")


