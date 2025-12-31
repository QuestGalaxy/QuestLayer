import { initQuestLayer } from './widget-runtime.tsx';

window.QuestLayer = window.QuestLayer || { init: initQuestLayer };
window.QuestLayer.init = initQuestLayer;

export { initQuestLayer as init };
