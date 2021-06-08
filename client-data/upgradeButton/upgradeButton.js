const upgradeBoard = document.querySelector('.upgrade-board');
const upgradeBoardButton =  document.querySelector('.upgrade-button');

// Request to show or not boards upgrade button

async function showUpgradeButton() {
    let url = Tools.server_config.API_URL + '';
    let response = await fetch(
        url,  
        {
            headers: new Headers({
                'Accept': 'application/json',
            }),
            method: 'GET',
            credentials: "include",
        });
    
    let data = await response.json();

    if (data.showButton) {
        upgradeBoard.classList.remove('hide');

        upgradeBoard.addEventListener('click', openUpgradeModal);    
    }
}

openUpgradeModal = (event) => {
    createModal(Tools.modalWindows.upgradeBoard);
    ym(68060329,'reachGoal','upgrade');
}
