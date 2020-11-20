
if (checkParam("tour","1")) initTutorial();

function searchParam() {
    return window.location.search
        .replace( '?', '')
        .split("&")
        .map(item=>{
            let sub_arr = item.split("=");
            return {key:sub_arr[0], value:sub_arr[1]}});
}

function checkParam(param, value) {
    return searchParam().some(x=>x.key===param && x.value===value)
}

function initTutorial() {
    const tutorial_step_count=4;
    let current_step = 0;

    const tutorial_elem = document.querySelector(".tutorial"),
          begin_btn = tutorial_elem.querySelector(".tutorial__btn--begin"),
          tutorial_counter = tutorial_elem.querySelector(".tutorial__counter"),
          tutorial_step_elem = [...document.querySelectorAll(".tutorial__text>li, body>.tutorial_panel")]
              .map(item=> {return {id:Number(item.getAttribute("data-tutorial_step")), element:item}});
    

    tutorial_elem.classList.add("start");
    tutorial_elem.querySelectorAll(".tutorial__btn--next")
        .forEach(item=>item.addEventListener("click",nextStep,false));
    tutorial_elem.querySelectorAll(".tutorial__btn--end")
        .forEach(item=>item.addEventListener("click",endTutorial,false));


    function nextStep() {
        if(current_step<tutorial_step_count) {
            if(current_step===0)
            {
                tutorial_elem.classList.add("active");
            }
            switchPanel();
            current_step++;
            tutorial_counter.innerText = `${current_step} / ${tutorial_step_count}`;
            switchPanel();
            if(current_step===tutorial_step_count){
                tutorial_elem.querySelector(".tutorial__start .tutorial__btn--next").innerText = "Начать работу";
                tutorial_elem.querySelector(".tutorial__start .tutorial__btn--end").style.display = "none";
                begin_btn.classList.add("active");
            }
        }
        else{
            endTutorial();
        }
    }
    
    function endTutorial() {
        switchPanel();
        tutorial_elem.classList.remove("start");
    }

    function resetTutorial() {
        begin_btn.classList.remove("active");
        tutorial_elem.querySelector(".tutorial__start .tutorial__btn--next").innerText = "Понятно";
        tutorial_elem.querySelector(".tutorial__start .tutorial__btn--end").style.display = "block";
        switchPanel();
        current_step=0;
        nextStep();
    }


    function switchPanel() {
        tutorial_step_elem.forEach(item=>{
            if(item.id===current_step)
                item.element.classList.toggle("active")
        });
    }
};

