import{c as r,r as t,o as i}from"./index-C4BwPaCC.js";/**
 * @license lucide-react v0.561.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],l=r("plus",u),h=(e,n)=>{t.useEffect(()=>{const s=i();if(!s)return;const c=s.channel(`realtime_updates_${e.join("_")}`);return e.forEach(o=>{c.on("postgres_changes",{event:"*",schema:"public",table:o},a=>{console.log(`Realtime update received for ${o}:`,a),n()})}),c.subscribe(o=>{o==="SUBSCRIBED"&&console.log(`Subscribed to realtime updates for: ${e.join(", ")}`)}),()=>{s.removeChannel(c)}},[e.join(","),n])};export{l as P,h as u};
