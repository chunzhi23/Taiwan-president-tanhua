import json, requests
import natsort
import subprocess
import pandas as pd

from flask import Flask, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/NEWS/<int:id>')
def news(id):
    return render_template('news.html')

@app.route('/api/articles', methods=['GET'])
def get_articles():
    data = request.args.get('action')
    if data == 'new':
        subprocess.run('go run main.go', shell=True, stdout=subprocess.PIPE)

    df = pd.read_csv('data/articles.csv')
    df = df.iloc[natsort.index_humansorted(df['date'])]
    return json.dumps(df.to_dict(orient='records'), ensure_ascii=False)

@app.route('/api/details', methods=['GET'])
def get_details():
    data = request.args.get('id')
    url = 'https://www.president.gov.tw/NEWS/%s' % data
    req = requests.get(url)
    soup = BeautifulSoup(req.text, 'html.parser')

    tb = soup.select('#wrapper > section > div > div.words > div.president > div > div.col-sm-8')[0]
    divs = tb.find_all('div', recursive=False)
    subtitle = divs[0].get_text().strip()
    date = divs[1].get_text().strip()
    
    content = ''
    ps = tb.find_all('p')
    for p in ps:
        content += p.get_text().strip()

    return json.dumps({
        'subtitle': subtitle,
        'date': date,
        'content': content
    }, ensure_ascii=False)

if __name__ == '__main__':
    app.run(debug=True)