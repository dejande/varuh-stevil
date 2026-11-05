import '@fontsource-variable/baloo-2';
import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { App } from './ui/app';

registerSW({ immediate: true });
void App.start(document.querySelector<HTMLElement>('#app')!);
