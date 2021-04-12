(function adsManaging() {
    const adBanner = document.getElementById('banner-ad');
    const closeAd = adBanner.querySelector('.closeAd');
    const closedAdBanner = document.querySelector('.closedBanner');
    const closeAdBanner = closedAdBanner.querySelector('.closeAd');
    const actualTime = 2*60*60*1000; //2h

    // Doing request that returns 2 things, show banner or not, and delay of showing that banner

    function getShowAdBanner() {
        let url = Tools.server_config.API_URL + `ads/can-show?boardId=${Tools.boardName}`;
        fetch(url,
        {
            headers: new Headers({
                'Accept': 'application/json',
            }),
            method: 'GET',
            credentials: "include",
        })
        .then(response => response.json())
        .then(data => {
            if (!data.canShow) return;

            let showAdBanner = new Timer(1000, data.intervalSeconds);

            closeAd.addEventListener('click', () => { showPopup(showAdBanner) });
            closeAdBanner.addEventListener('click', () => { closePopup(showAdBanner) });
        })
    }

    getShowAdBanner();

    // Set nextShowTime in session storage

    function setNextShowTime(value) {
        return sessionStorage.setItem('nextShowTime', value);
    }

    // Get nextShowTime from session storage

    function getNextShowTime() {
        return Number(sessionStorage.getItem('nextShowTime'));
    }
    
    // Function for starting, stopping and reseting timer (interval), to check current time and compare it to nextShowTime

    function Timer(dateUpd , intervalSeconds) {
        let nextShowTime = new Date(new Date().getTime() + intervalSeconds * 1000).getTime();


        // Storing nextShowTime in session storage (if we already dont have one)

        if (
            !sessionStorage.getItem('nextShowTime')
            || sessionStorage.getItem('nextShowTime') < (Date.now() - actualTime)
        ) {
            setNextShowTime(nextShowTime);
        }

        // If current time is bigger than nextShowTime (in session storage) show ad banner immediately

        // if (Date.now() > getNextShowTime()) {
        //     adBanner.classList.remove('hide');
        // }

        // Timer function, when current date equal to nextShowDate (current date + delay from request, getting from session storage), we'll show ad banner and stop timer

        let func = () => {
            let now = Date.now();

            if ((now - getNextShowTime()) > 0 && (now - getNextShowTime()) < actualTime) {
                adBanner.classList.remove('hide');
                this.stop();
            }
        }
        
        let timerObj = setInterval(func, dateUpd);

        // Stop timer (interval)
        this.stop = function() {
            if (timerObj) {
                clearInterval(timerObj);
                timerObj = null;
            }
            return this;
        }
    
        // Start timer with current delay (if it's not already running)
        this.start = function() {
            if (!timerObj) {
                this.stop();
                timerObj = setInterval(func, dateUpd);
            }
            return this;
        }
    
        // Start with new or original interval, stop current interval
        this.reset = function(newTimer = dateUpd) {
            dateUpd = newTimer;
            nextShowTime = new Date(new Date().getTime() + intervalSeconds * 1000).getTime();
            setNextShowTime(nextShowTime);
            return this.stop().start();
        }
    }

    // Show popup

    function showPopup(bannerInterval) {
        adBanner.classList.add('hide');
        closedAdBanner.classList.remove('hide');
        bannerInterval.stop();
    }

    // Close popup and set timer to show banner sum delay (from request) after its closing

    function closePopup(bannerInterval) {
        closedAdBanner.classList.add('hide');
        bannerInterval.reset();
    }
})() 