# -*- coding: utf-8 -*-
import requests
r = requests.post('http://127.0.0.1:5010/api/v1/rag/query',
                  json={'query': '灵山大佛有多高？', 'top_k': 3},
                  headers={'Authorization': 'Bearer dev-token-123456'})
print(r.text)
