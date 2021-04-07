(function adsManaging() {
    const adBanner = document.getElementById('banner-ad');
    const closeAd = adBanner.querySelector('.closeAd');
    const closedAdBanner = document.querySelector('.closedBanner');
    const closeAdBanner = closedAdBanner.querySelector('.closeAd');
    const disableAdsBtn = closedAdBanner.querySelector('.disableAdsBtn');
   

    // Doing request that returns 2 things, show banner or not, and delay of showing that banner

    async function getShowAdBanner() {
        let url = Tools.server_config.API_URL + 'ads/can-show';
        let response = await fetch(url,
        {
            
            headers: new Headers({
                'Accept': 'application/json',
            }),
            method: 'GET',
            credentials: 'include',
        });

        let adData = await response.json();

        return {
            showAd: adData.canShow,
            delay: adData.intervalSeconds
        }
    }

    const { showAd, delay } = getShowAdBanner();

    // If request returned showAd-false don't set timer and don't show ad banner

    if (!showAd) {
        return;
    }

    // Set nextShowTime in session storage

    function setNextShowTime(value) {
        return sessionStorage.setItem('nextShowTime', value);
    }

    // Get nextShowTime from session storage

    function getNextShowTime() {
        return Number(sessionStorage.getItem('nextShowTime'));
    }
    
    // Function for starting, stopping and reseting timer (interval), to check current time and compare it to nextShowTime

    function Timer(dateUpd) {
        let nextShowTime = new Date(new Date().getTime() + delay * 1000).getTime();

        // Storing nextShowTime in session storage (if we already didn't have one)

        setNextShowTime(sessionStorage.getItem('nextShowTime') || nextShowTime);

        // Timer function, when current date equal to nextShowDate (current date + delay from request, getting from session storage), we'll show ad banner and stop timer

        let func = () => {
            if (!((Date.now() - getNextShowTime()) < 9 > 0)) {
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
            nextShowTime = new Date(new Date().getTime() + delay * 1000).getTime();
            setNextShowTime(nextShowTime);
            return this.stop().start();
        }
    }

    // Showing ad banner after sum delay (from request) of page load

    let showAdBanner = new Timer(1000);

    // If we already have nextShowTime and its smaller than current time - show banner
    
    if (new Date().getTime() > getNextShowTime()) {
        adBanner.classList.remove('hide');
    }

    // Show popup

    function showPopup() {
        adBanner.classList.add('hide');
        closedAdBanner.classList.remove('hide');
        showAdBanner.stop();
    }

    // Close popup and set timer to show banner sum delay (from request) after its closing

    function closePopup() {
        closedAdBanner.classList.add('hide');
        showAdBanner.reset();
    }

    // If user clicked on 'Отключить насовсем', clear interval and dont show ad banner for session, remove nextShowTime from session storage

    function disableAdsForSession() {
        closedAdBanner.classList.add('hide');
        sessionStorage.removeItem('nextShowTime');
        showAdBanner.stop();
    }

    closeAd.addEventListener('click', showPopup);
    closeAdBanner.addEventListener('click', closePopup);
    disableAdsBtn.addEventListener('click', disableAdsForSession);
})() 