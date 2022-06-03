async function getArticles(){
    let articleData;
    await fetch("/api/articles")
    .then(response => response.json())
    .then(data => {
        articleData = data;
    });
    
    const olWrap = document.querySelector("#wrap > ol");
    for (let i = 0; i < articleData.length; i++){
        let newLi = document.createElement("li");
        let newA = document.createElement("a");
        newA.innerText = articleData[i]["title"];
        newA.href = articleData[i]["url"];
        newLi.appendChild(newA);
        olWrap.appendChild(newLi);
    }
} getArticles();