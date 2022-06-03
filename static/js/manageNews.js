async function getDetails(){
    let detailData;
    let urlArray = window.location.href.split("/");
    let lastPara = urlArray[urlArray.length - 1];
    await fetch(`/api/details?id=${lastPara}`)
    .then(response => response.json())
    .then(data => {
        detailData = data;
    });

    let container = document.getElementById("container");
    let newB = document.createElement("b");
    setInnerSpan(detailData['subtitle'], "/", newB);
    container.appendChild(newB);

    let newDate = document.createElement("p");
    setInnerSpan(detailData['date'], "/", newDate);
    container.appendChild(newDate);

    let pgSplit = detailData['content'].split(/\r?\n/);
    for (let i = 0; i < pgSplit.length; i++){
        let newP = document.createElement("p");
        setInnerSpan(pgSplit[i], "/", newP);
        container.appendChild(newP);
    }
} getDetails();

function setInnerSpan(targetText, splitBy, parentNode){
    const regex = /[ $&+,:;=?@#|'<>.^*()%!\-，！？；：（）［］【】。「」﹁﹂"、·《》〈〉〔〕〖〗〘〙〚〛﹏…——～　_﹏A-Za-z0-9]/;
    let dataSplit = targetText.split(splitBy);
    for (let i = 0; i < dataSplit.length; i++){
        if (regex.exec(dataSplit[i]) != null || dataSplit[i] == ''){
            let newText = document.createTextNode(dataSplit[i]);
            parentNode.appendChild(newText);
        } else {
            let newSpan = document.createElement("span");
            newSpan.classList.add("hv_word_dict");
            newSpan.innerHTML = dataSplit[i];
            parentNode.appendChild(newSpan);
        }
    }
}

function setSpanEvent(){
    let activeElem = null;
    let tooltiplayer = document.getElementById("tooltiplayer");
    document.addEventListener("click", (evt) => {
        let targetElem = evt.target;
        if (targetElem instanceof HTMLSpanElement){
            if (targetElem.classList.contains("hv_word_dict")){
                if (activeElem !== targetElem){
                    if (activeElem !== null){
                        activeElem.classList.remove("active");
                        tooltiplayer.style.display = "none";
                    }
                    targetElem.classList.add("active");
                    activeElem = targetElem;
                    spanPopWindow(activeElem);
                }
            }
        } else if (activeElem !== null){
            tooltiplayer.style.display = "none";
            activeElem.classList.remove("active");
            activeElem = null;
        }
    });

    let drag = false;
    let layer_translated = document.getElementById("layer_translated");

    document.addEventListener("mousedown", () => drag = false);
    document.addEventListener("mousemove", () => drag = true);
    document.addEventListener("mouseup", (evt) => {
        if (drag){
            let selectedObj = window.getSelection();
            let selectedTxt = selectedObj.getRangeAt(0).toString();
            if (selectedTxt != ""){
                fetch("/api/zhko/translate", {
                    method: "POST",
                    body: JSON.stringify({
                        "target": "ko",
                        "text": selectedTxt
                    })
                })
                .then(response => response.json())
                .then(data => {
                    layer_translated.innerHTML = ''

                    let p = document.createElement("p");
                    let i = document.createElement("i");
                    i.classList.add("arrow_down");
                    i.addEventListener("click", () => layer_translated.style.display = "none");
                    p.appendChild(i);
                    
                    let text = document.createTextNode(data['text']);
                    p.appendChild(text);
                    layer_translated.appendChild(p);
                    
                    layer_translated.classList.add("active");
                    layer_translated.style.display = "block";
                });
            }
        }
    });
} setSpanEvent();

async function spanPopWindow(elem){
    const word = elem.innerHTML;
    let tooltiplayer = document.getElementById("tooltiplayer");
    tooltiplayer.innerHTML = "";

    await fetch(`/api/zhko/word?query=${word}`)
    .then(response => response.json())
    .then(data => {
        if (data.length === 0){
            let dl = document.createElement("dl");
            dl.classList.add("content");

            let span = document.createElement("span");
            span.innerHTML = "검색 결과가 없습니다.";
            dl.appendChild(span);
            tooltiplayer.appendChild(dl);
        }
        else {
            for (let i = 0; i < data.length; i++){
                let dl = document.createElement("dl");
                dl.classList.add("content");

                let dt = document.createElement("dt");
                dt.classList.add("word");

                let b = document.createElement("b");
                b.innerHTML = data[i]["word"];
                dt.appendChild(b);
                dl.appendChild(dt);

                var dd = document.createElement("dd");
                dd.classList.add("pronunciation");

                for (let j = 0; j < data[i]["pinyin"].length; j++){
                    var span = document.createElement("span");
                    span.innerHTML = `[${data[i]["pinyin"][j]}]`;
                    dd.appendChild(span);
                }
                dl.appendChild(dd);
                
                var dd = document.createElement("dd");
                dd.classList.add("definition");

                let ul = document.createElement("ul");
                ul.classList.add("meaning");
                
                for (let j = 0; j < data[i]["meaning"].length; j++){
                    let foc = data[i]["meaning"][j]["data"];
                    var li = document.createElement("li");
                    for (let k = 0; k < foc.length; k++){
                        var span = document.createElement("span");
                        span.innerHTML = foc[k];
                        
                        while (span.children.length != 0){
                            let elem = span.children[0]
                            elem.outerHTML = elem.innerHTML;
                        }
                        li.appendChild(span);
                    }
                    ul.appendChild(li);
                }
                dd.appendChild(ul);

                var span = document.createElement("span");
                span.classList.add("source");
                span.innerHTML = `출처: ${data[i]["source"]}`;
                dd.appendChild(span);
                dl.appendChild(dd);
                tooltiplayer.appendChild(dl);
            }
        }
    });
    
    let pos_top = getCoordinates(elem).top;
    let pos_left = getCoordinates(elem).left;

    tooltiplayer.style.top = (pos_top + 20) +"px";
    tooltiplayer.style.left = pos_left +"px";
    tooltiplayer.style.display = "block";
}

function getCoordinates(elem){
    const rect = elem.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
    };
}