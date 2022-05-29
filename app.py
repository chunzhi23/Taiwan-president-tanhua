import json
import natsort
import subprocess
import pandas as pd

from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/articles', methods=['GET', 'POST'])
def get_articles():
    if request.method == 'POST':
        data = request.get_json()
        if data['action'] == 'new':
            subprocess.run('go run main.go', shell=True, stdout=subprocess.PIPE)

    df = pd.read_csv('data/articles.csv')
    df = df.iloc[natsort.index_humansorted(df['date'])]
    return json.dumps(df.to_dict(orient='records'), ensure_ascii=False)

if __name__ == '__main__':
    app.run(debug=True)