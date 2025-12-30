import{c as r,r as t,n as i}from"./index-Drz-DYtp.js";/**
 * @license lucide-react v0.561.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],l=r("plus",u),h=(e,n)=>{t.useEffect(()=>{const o=i();if(!o)return;const c=o.channel(`realtime_updates_${e.join("_")}`);return e.forEach(s=>{c.on("postgres_changes",{event:"*",schema:"public",table:s},a=>{console.log(`Realtime update received for ${s}:`,a),n()})}),c.subscribe(s=>{s==="SUBSCRIBED"&&console.log(`Subscribed to realtime updates for: ${e.join(", ")}`)}),()=>{o.removeChannel(c)}},[e.join(","),n])};export{l as P,h as u};
