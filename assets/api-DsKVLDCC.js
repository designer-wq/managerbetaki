import{n as s}from"./index-C9-p5gNH.js";const m=async e=>{const t=s();if(t)try{await t.from("logs").insert([e])}catch(r){console.error("Failed to log action:",r)}},y=async e=>{const t=s();if(!t)return[];let{data:r,error:o}=await t.from(e).select("*").order("created_at",{ascending:!1});if(o){const n=await t.from(e).select("*");return n.error?(console.error(`Error fetching ${e}:`,n.error),[]):n.data||[]}return r||[]},w=async()=>{const e=s();if(!e)return[];const{data:t,error:r}=await e.from("demands").select(`
            *,
            origins ( name ),
            demand_types ( name ),
            statuses ( name, color, "order" ),
            responsible:profiles!demands_responsible_id_fkey ( name, avatar_url )
        `).order("created_at",{ascending:!1});return r?(console.error("Error fetching demands:",r),[]):t},b=async(e,t,r)=>{const o=s();if(!o)return null;const{data:n,error:l}=await o.from(e).select("*").eq(t,r).single();return l?null:n},E=async(e,t,r)=>{const o=s();if(!o)return null;const{data:n,error:l}=await o.from(e).insert([t]).select().single();if(l)throw console.error(`Error creating record in ${e}:`,l),l;return r&&await m({user_id:r,action:"CREATE",table_name:e,record_id:n==null?void 0:n.id,details:t}),n},D=async(e,t,r,o)=>{const n=s();if(!n)return null;const l=(a,c)=>{if(typeof a!="string"||typeof c!="string"||a===c)return null;let d=0;const u=Math.min(a.length,c.length);for(;d<u&&a[d]===c[d];)d++;let f=0;for(;f<u-d&&a[a.length-1-f]===c[c.length-1-f];)f++;return c.slice(d,c.length-f)};let i=null;try{const{data:a}=await n.from(e).select("*").eq("id",t).single();i=a||null}catch{i=null}const{data:_,error:g}=await n.from(e).update({...r,updated_at:new Date().toISOString()}).eq("id",t).select().single();if(g)throw console.error(`Error updating record in ${e}:`,g),g;if(o){const a={...r};i&&typeof r=="object"&&Object.keys(r).forEach(c=>{const d=i==null?void 0:i[c],u=r==null?void 0:r[c];if(typeof d=="string"&&typeof u=="string"){const f=l(d,u);f&&f.trim().length>0&&(c==="description"?a.description_delta=f:(a.__diff||(a.__diff={}),a.__diff[c]={delta:f}))}}),await m({user_id:o,action:"UPDATE",table_name:e,record_id:t,details:a})}return _},S=async(e,t,r)=>{const o=s();if(!o)return!1;const{error:n}=await o.from(e).delete().eq("id",t);if(n)throw console.error(`Error deleting record from ${e}:`,n),n;return!0},R=async e=>{const t=s();if(!t)return[];const{data:r,error:o}=await t.from("comments").select(`
            *,
            profiles ( name, avatar_url )
        `).eq("demand_id",e).order("created_at",{ascending:!0});return o?(console.error("Error fetching comments:",o),[]):r},q=async e=>{const t=s();if(!t)return[];const{data:r,error:o}=await t.from("logs").select(`
            *,
            profiles ( name )
        `).eq("record_id",e).order("created_at",{ascending:!1});return o?(console.error("Error fetching logs:",o),[]):r},A=async(e=30)=>{const t=s();if(!t)return[];const r=new Date;r.setDate(r.getDate()-e);const{data:o,error:n}=await t.from("logs").select("id, record_id, action, details, created_at").gte("created_at",r.toISOString()).order("created_at",{ascending:!1});return n?(console.error("Error fetching all logs:",n),[]):o},I=async(e=30)=>{const t=s();if(!t)return[];const r=new Date;r.setDate(r.getDate()-e);const{data:o,error:n}=await t.from("comments").select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `).gte("created_at",r.toISOString()).order("created_at",{ascending:!1});return n?(console.error("Error fetching recent comments:",n),[]):o},L=async(e=30)=>{const t=s();if(!t)return[];const r=new Date;r.setDate(r.getDate()-e);const{data:o,error:n}=await t.from("comments").select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `).gte("created_at",r.toISOString()).ilike("content","%@%").order("created_at",{ascending:!1});return n?(console.error("Error fetching mentions:",n),[]):o},O=async e=>{const t=s();if(!t||!e||e.length===0)return[];const{data:r,error:o}=await t.from("demands").select(`
            id,
            title,
            statuses ( name, color )
        `).in("id",e);return o?(console.error("Error fetching demands by ids:",o),[]):r||[]},$=async()=>{const e=s();if(!e)return[];const{data:t,error:r}=await e.from("profiles").select("*");return r?(console.error("Error fetching profiles:",r),[]):t||[]},C=async()=>{const e=s();if(!e)return[];const{data:t,error:r}=await e.rpc("get_auth_users_list");return r?(console.error("Error fetching auth users list:",r),[]):t||[]},j=async(e,t,r,o)=>{const n=s();if(!n)return null;const{data:l,error:i}=await n.from(e).upsert(t,{onConflict:r}).select().single();if(i)throw console.error(`Error upserting record in ${e}:`,i),i;return l};export{E as createRecord,S as deleteRecord,A as fetchAllLogs,C as fetchAuthUsersList,b as fetchByColumn,R as fetchComments,w as fetchDemands,O as fetchDemandsByIds,q as fetchLogs,$ as fetchProfiles,I as fetchRecentComments,L as fetchRecentMentions,y as fetchTable,m as logAction,D as updateRecord,j as upsertRecord};
