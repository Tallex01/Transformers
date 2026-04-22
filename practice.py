import torch
import torch.nn as nn

embedding = nn.Embedding(10,2)      # (thing you want to embed, number of dims) -> e.g. numbers 0-9

result = embedding(torch.tensor(7)).tolist()

print(result)



