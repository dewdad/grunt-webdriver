{
  "type": "script",
  "seleniumVersion": "2",
  "formatVersion": 2,
  "steps": [
    {
      "type": "get",
      "url": "https://github.com/"
    },
    {
      "type": "setElementText",
      "locator": {
        "type": "name",
        "value": "user[login]"
      },
      "text": "pocproj"
    },
    {
      "type": "setElementText",
      "locator": {
        "type": "name",
        "value": "user[email]"
      },
      "text": "pocproj@gmail.com"
    },
    {
      "type": "setElementText",
      "locator": {
        "type": "name",
        "value": "user[password]"
      },
      "text": "PitPituach!1"
    },
    {
      "type": "setElementText",
      "locator": {
        "type": "name",
        "value": "q"
      },
      "text": "grunt-webdriver"
    },
    {
      "type": "sendKeysToElement",
      "locator": {
        "type": "name",
        "value": "q"
      },
      "text": "\n"
    },
    {
      "type": "clickElement",
      "locator": {
        "type": "link text",
        "value": "webdriverio/grunt-webdriver"
      }
    },
    {
      "type": "clickElement",
      "locator": {
        "type": "xpath",
        "value": "//ul[@class='numbers-summary']/li[3]/a"
      }
    }
  ],
  "data": {
    "configs": {},
    "source": "none"
  },
  "inputs": [],
  "timeoutSeconds": 60
}