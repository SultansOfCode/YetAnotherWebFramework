import './css/style.css';
import { YAWF } from './lib/yawf.ts';

const app = new YAWF({
  el: 'app',
  data: {
    name: 'Sultans of Code',
    test: ''
  }
});

(window as any).app = app;
