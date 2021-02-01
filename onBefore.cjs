module.exports = async (page, scenario, vp) => {
    const ignoredMessages = [
        'Download the React DevTools for a better development experience',
        'BackstopTools have been installed',
        'x Close Browser',
        'JSHandle',

    ];

    console.log = (message) => {
        ignoredMessages.some(ignore => message.includes(ignore)) ? undefined : process.stdout.write(`${message} for ${scenario.label} on ${vp.label},   \n`);
    };
};