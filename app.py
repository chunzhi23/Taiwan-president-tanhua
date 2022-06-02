import json, requests
import natsort
import subprocess
import jieba
import chinese_converter as ccvt
import pandas as pd

from flask import Flask, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/NEWS/<int:id>')
def news(id):
    df = pd.read_csv('data/articles.csv')
    title = df[df['url'] == f'/NEWS/{id}']['title'].item()
    return render_template('news.html', title=title)

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
    subtitle_raw = divs[0].get_text().strip()
    subtitle = '/'.join(jieba.cut(subtitle_raw, cut_all=False))

    date_raw = divs[1].find('span', {'class': 'date_green'}).get_text().strip()
    date = '/'.join(jieba.cut(date_raw, cut_all=False))
    
    content = ''
    jieba.load_userdict('data/dict.txt')
    ps = tb.find('p', recursive=False)
    for p in ps:
        seg_list = jieba.cut(p.get_text().strip(), cut_all=False)
        content += '\n'+ '/'.join(seg_list)

    return json.dumps({
        'subtitle': subtitle,
        'date': date,
        'content': content
    }, ensure_ascii=False)

@app.route('/api/zhko/word', methods=['GET'])
def get_zhko_word():
    query = request.args.get('query')
    query_simplified = ccvt.to_simplified(query)
    
    url = 'https://zh.dict.naver.com/api3/zhko/search?query=%s'
    header = {'user-agent': 'Chrome/101.0.4951.67'}

    req = requests.get(url % query_simplified, headers=header)
    data = json.loads(req.text)
    items = data['searchResultMap']['searchResultListMap']['WORD']['items']
    
    ret_data = list()
    for item in items:
        if item['handleEntry'] in query_simplified:
            query_simplified = query_simplified.replace(item['handleEntry'], '')
            
            word = item['handleEntry']
            source = item['sourceDictnameKO']
            pinyin = item['symbolValue']
            
            all_word_speech = list()
            for description in item['meansCollector']:
                speech = description['partOfSpeech']
                val_list = list()
                for mean in description['means']:
                    value = mean['value']
                    val_list.append(value)
                
                each_speech_about = dict({
                    'speech': speech,
                    'data': val_list})
                
                all_word_speech.append(each_speech_about)
            
            word_dict = dict({
                'word': word,
                'source': source,
                'pinyin': pinyin,
                'meaning': all_word_speech})

            ret_data.append(word_dict)
        elif query_simplified == '':
            break

    return ccvt.to_traditional(json.dumps(ret_data, ensure_ascii=False))

if __name__ == '__main__':
    app.run(debug=True)