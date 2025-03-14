const viewports = [
    {
        "label": "desktop",
        "width": 1300,
        "height": 768
    },
    {
        "label": "phone",
        "width": 320,
        "height": 480
    }
]

const scenario = {
    "readyEvent": "",
    "readySelector": "",
    "delay": 0,
    "hideSelectors": [],
    "removeSelectors": [],
    "hoverSelector": "",
    "clickSelector": "",
    "postInteractionWait": 0,
    "selectors": [],
    "selectorExpansion": true,
    "expect": 0,
    "misMatchThreshold": 0.1,
    "requireSameDimensions": true,
    "onBeforeScript": "../../onBefore.cjs",
    "cookiePath": "backstop_data/engine_scripts/cookies.json",
}

const other = {
    "report": [
        "browser"
    ],
    "engine": "puppeteer",
    "engineOptions": {
        "args": [
            "--no-sandbox"
        ]
    },
    "asyncCaptureLimit": 5,
    "asyncCompareLimit": 50,
    "debug": false,
    "debugWindow": false
}

export {
    viewports,
    scenario,
    other
}

