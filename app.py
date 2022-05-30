import json
import natsort
import subprocess
import pandas as pd

from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/NEWS/<int:id>')
def news(id):
    return render_template('news.html')

@app.route('/api/articles', methods=['GET'])
def get_articles():
    data = request.args.get("action")
    if data == 'new':
        subprocess.run('go run main.go', shell=True, stdout=subprocess.PIPE)

    df = pd.read_csv('data/articles.csv')
    df = df.iloc[natsort.index_humansorted(df['date'])]
    return json.dumps(df.to_dict(orient='records'), ensure_ascii=False)

# @app.route('/api/details', methods=['GET'])

if __name__ == '__main__':
    app.run(debug=True)