const App = require('./App');

const app = new App(process.env.PORT || 3000);
app.init().then(() => app.start());
