const carlo = require('carlo');
const ICF = require('./js/icf');

(async () => {
  // Launch the browser.
  const app = await carlo.launch();

  /*
  transparent:true,
    frame: false
  */

  // Terminate Node.js process on app window closing.
  app.on('exit', () => process.exit());

  // Tell carlo where your web files are located.
  app.serveFolder(__dirname);

  // Expose 'loadICF' function in the web environment.
  await app.exposeFunction('loadICF', _ => ICF.loadICF().then(_ => ICF.rawData()).catch(e => console.error(e)));

  // Navigate to the main page of your app.
  await app.load('index.html');
})();

