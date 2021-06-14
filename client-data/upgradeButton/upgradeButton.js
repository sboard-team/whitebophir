const upgradeBoard = document.querySelector('.upgrade-board');
const upgradeBoardButton =  document.querySelector('.upgrade-button');

let onUpgradeBoard = () => {
    ym(68060329,'reachGoal','upgrade_tariff');
    window.open('https://vk.cc/c2HzRJ', '_self');
}

let openUpgradeModal = (event) => {
    createModal(Tools.modalWindows.upgradeBoard, function () {
        ym(68060329,'reachGoal','upgrade');
        document.querySelector('.upgrade-button').addEventListener('click', onUpgradeBoard)
    });
}

upgradeBoard.addEventListener('click', openUpgradeModal);    