package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type article struct {
	title   string
	date    string
	summary string
	url     string
}

func main() {
	defer os.Remove("data/articles.csv")
	articles := scrapData()
	writeArticles(articles)
}

func writeArticles(articles []article) {
	file, err := os.Create("data/articles.csv")
	checkError(err)

	w := csv.NewWriter(file)
	defer w.Flush()

	headers := []string{"title", "date", "summary", "url"}
	writeErr := w.Write(headers)
	checkError(writeErr)

	for _, article := range articles {
		articleCSV := []string{article.title, article.date, article.summary, article.url}
		writeErr := w.Write(articleCSV)
		checkError(writeErr)
	}
}

func scrapData() []article {
	baseUrl := "https://www.president.gov.tw/Issue/58"
	var articles []article
	c := make(chan []article)

	pageCnt := getPageCnt(baseUrl)
	fmt.Println(pageCnt, "pages detected")

	for i := 0; i < pageCnt; i++ {
		go focusPage(i+1, c, baseUrl)
	}

	for i := 0; i < pageCnt; i++ {
		pageArticles := <-c
		articles = append(articles, pageArticles...)
	}
	return articles
}

func focusPage(number int, mainChannel chan []article, url string) {
	var articles []article
	pageUrl := url + "?DeteailNo=" + strconv.Itoa(number)
	fmt.Println("Scrapping indeed: Page", number)

	res, err := http.Get(pageUrl)
	checkError(err)
	checkStatusCode(res)

	doc, err := goquery.NewDocumentFromReader(res.Body)
	checkError(err)

	innerChannel := make(chan article)

	gridCard := doc.Find("#grid > li")
	gridCard.Each(func(i int, s *goquery.Selection) {
		go focusCard(s, innerChannel)
	})

	for i := 0; i < gridCard.Length(); i++ {
		extracted := <-innerChannel
		articles = append(articles, extracted)
	}

	mainChannel <- articles
}

func focusCard(s *goquery.Selection, c chan article) {
	s.Find("a").Each(func(i int, a *goquery.Selection) {
		if _, stat := a.Attr("title"); !stat {
			var title string
			a.Find("span").Each(func(i int, sp *goquery.Selection) {
				if _, stat := sp.Attr("style"); stat {
					title = cleanString(sp.Text())
				}
			})
			date := cleanString(a.Find("#item > .news_date > .header_contact > span").Text())
			summary := cleanString(a.Find("#item > p").Text())
			url, _ := a.Attr("href")
			c <- article{
				title:   title,
				date:    date,
				summary: summary,
				url:     url,
			}
		}
	})
}

func getPageCnt(url string) int {
	pages := 0
	res, err := http.Get(url)
	checkError(err)
	checkStatusCode(res)

	doc, err := goquery.NewDocumentFromReader(res.Body)
	checkError(err)

	doc.Find(".pagination").Each(func(i int, s *goquery.Selection) {
		aElem := s.Find("a").Length()
		spElem := s.Find("a > span").Length()
		pages = aElem - spElem
	})

	return pages
}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func checkStatusCode(res *http.Response) {
	if res.StatusCode != 200 {
		log.Fatal("Status Code:", res.StatusCode)
	}
}

func cleanString(str string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(str)), "")
}
