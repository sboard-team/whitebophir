initTutorial();

function initTutorial() {
    const tutorial_steps=[
            new TutorialStep(
                 "С помощью инструментов вы можете рисовать, писать, добавлять фигуру и изображения, печатать формулыи текст",
                 [".undo-redo-panel", ".tool-panel"]),
            new TutorialStep(
                "Подберите удобный для работы масштаб доски. Обратите внимание, ширина доски ограничена",
                [".scale-panels__wrapper"]),
            new TutorialStep(
                "Что бы работать на доске вместе с учениками, нажмите кнопку \"Поделиться\" и отправте появившиеся ссылку ученикам"
                ,[".export-and-help-panel"]),
            new TutorialStep(
                "В меню под логотипом Вы можете очистить доску, сохранить её в PDF или перейти в личный кабинет",
                [".top-panel"])
        ];
    const tutorial_step_count=tutorial_steps.length-1;
    let current_step = 0;

    const tutorial_elem = document.querySelector(".tutorial"),
          tutorial_text = tutorial_elem.querySelector(".tutorial__text");

    tutorial_elem.classList.add("start");
    tutorial_elem.querySelectorAll(".tutorial__btn--next")
        .forEach(item=>item.addEventListener("click",nextStep,false));
    tutorial_elem.querySelectorAll(".tutorial__btn--end")
        .forEach(item=>item.addEventListener("click",endTutorial,false));

    
    function nextStep() {
        if(current_step<=tutorial_step_count) {
            if(current_step===0)
            {
                tutorial_elem.classList.add("active");
            }
            else{
                tutorial_steps[current_step-1].removePanel();
            }
            if(current_step===tutorial_step_count){
                tutorial_elem.querySelector(".tutorial__start .tutorial__btn--next").innerText = "Начать работу";
                tutorial_elem.querySelector(".tutorial__start .tutorial__btn--end").style.display = "none";
            }
            tutorial_steps[current_step].selectPanel();
            current_step++;
        }
        else{
            endTutorial();
        }
    }
    
    function endTutorial() {
        if(current_step!==0)
            tutorial_steps[current_step-1].removePanel();
        tutorial_elem.classList.remove("start");
    }


    function TutorialStep(text, panel_classes) {
        this.text = text;
        this.panel_classes = panel_classes;

        this.initPanel = function () {
            return this.panel_classes.map(item=>document.querySelector(item));
        };

        this.panels = this.initPanel();

        this.selectPanel = function () {
            tutorial_text.innerText = this.text;
            this.panels.forEach(item=>{
                item.classList.add("active");
            })
        };

        this.removePanel = function () {
            this.panels.forEach(item=>{
                item.classList.remove("active");
            })
        };
    }
};



