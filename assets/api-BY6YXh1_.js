import{o as a}from"./index-DA3Qi5Md.js";const g=async r=>{const t=a();if(t)try{await t.from("logs").insert([r])}catch(e){console.error("Failed to log action:",e)}},_=async r=>{const t=a();if(!t)return[];let{data:e,error:n}=await t.from(r).select("*").order("created_at",{ascending:!1});if(n){const o=await t.from(r).select("*");return o.error?(console.error(`Error fetching ${r}:`,o.error),[]):o.data||[]}return e||[]},h=async()=>{const r=a();if(!r)return[];const{data:t,error:e}=await r.from("demands").select(`
            *,
            origins ( name ),
            demand_types ( name ),
            statuses ( name, color, "order" ),
            responsible:profiles!demands_responsible_id_fkey ( name, avatar_url )
        `).order("created_at",{ascending:!1});return e?(console.error("Error fetching demands:",e),[]):t},p=async(r,t,e)=>{const n=a();if(!n)return null;const{data:o,error:s}=await n.from(r).select("*").eq(t,e).single();return s?null:o},w=async(r,t,e)=>{const n=a();if(!n)return null;const{data:o,error:s}=await n.from(r).insert([t]).select().single();if(s)throw console.error(`Error creating record in ${r}:`,s),s;return e&&await g({user_id:e,action:"CREATE",table_name:r,record_id:o==null?void 0:o.id,details:t}),o},y=async(r,t,e,n)=>{const o=a();if(!o)return null;let s=null;try{const{data:i}=await o.from(r).select("*").eq("id",t).single();s=i||null}catch{s=null}const{data:c,error:d}=await o.from(r).update({...e,updated_at:new Date().toISOString()}).eq("id",t).select().single();if(d)throw console.error(`Error updating record in ${r}:`,d),d;if(n){const i={};s&&typeof e=="object"&&Object.keys(e).forEach(l=>{const f=s==null?void 0:s[l],u=e==null?void 0:e[l];f!==u&&(i[l]={before:f,after:u})}),Object.keys(i).length>0&&await g({user_id:n,action:"UPDATE",table_name:r,record_id:t,details:i})}return c},b=async(r,t,e)=>{const n=a();if(!n)return!1;let o=null;try{const{data:c}=await n.from(r).select("*").eq("id",t).single();o=c}catch{}const{error:s}=await n.from(r).delete().eq("id",t);if(s)throw console.error(`Error deleting record from ${r}:`,s),s;return!0},E=async r=>{const t=a();if(!t)return[];const{data:e,error:n}=await t.from("comments").select(`
            *,
            profiles ( name, avatar_url )
        `).eq("demand_id",r).order("created_at",{ascending:!0});return n?(console.error("Error fetching comments:",n),[]):e},D=async r=>{const t=a();if(!t)return[];const{data:e,error:n}=await t.from("logs").select(`
            *,
            profiles ( name )
        `).eq("record_id",r).order("created_at",{ascending:!1});return n?(console.error("Error fetching logs:",n),[]):e},S=async(r=30)=>{const t=a();if(!t)return[];const e=new Date;e.setDate(e.getDate()-r);const{data:n,error:o}=await t.from("logs").select(`
            id, 
            record_id, 
            action, 
            details, 
            created_at,
            user_id,
            profiles ( name, avatar_url )
        `).gte("created_at",e.toISOString()).order("created_at",{ascending:!1});return o?(console.error("Error fetching all logs:",o),[]):n},R=async(r=30)=>{const t=a();if(!t)return[];const e=new Date;e.setDate(e.getDate()-r);const{data:n,error:o}=await t.from("comments").select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `).gte("created_at",e.toISOString()).order("created_at",{ascending:!1});return o?(console.error("Error fetching recent comments:",o),[]):n},q=async(r=30)=>{const t=a();if(!t)return[];const e=new Date;e.setDate(e.getDate()-r);const{data:n,error:o}=await t.from("comments").select(`
            id,
            demand_id,
            content,
            created_at,
            profiles ( name )
        `).gte("created_at",e.toISOString()).ilike("content","%@%").order("created_at",{ascending:!1});return o?(console.error("Error fetching mentions:",o),[]):n},O=async r=>{const t=a();if(!t||!r||r.length===0)return[];const{data:e,error:n}=await t.from("demands").select(`
            id,
            title,
            statuses ( name, color )
        `).in("id",r);return n?(console.error("Error fetching demands by ids:",n),[]):e||[]},A=async()=>{const r=a();if(!r)return[];const{data:t,error:e}=await r.from("profiles").select("*");return e?(console.error("Error fetching profiles:",e),[]):t||[]},I=async()=>{const r=a();if(!r)return[];const{data:t,error:e}=await r.rpc("get_auth_users_list");return e?(console.error("Error fetching auth users list:",e),[]):t||[]},$=async(r,t,e,n)=>{const o=a();if(!o)return null;const{data:s,error:c}=await o.from(r).upsert(t,{onConflict:e}).select().single();if(c)throw console.error(`Error upserting record in ${r}:`,c),c;return s};export{w as createRecord,b as deleteRecord,S as fetchAllLogs,I as fetchAuthUsersList,p as fetchByColumn,E as fetchComments,h as fetchDemands,O as fetchDemandsByIds,D as fetchLogs,A as fetchProfiles,R as fetchRecentComments,q as fetchRecentMentions,_ as fetchTable,g as logAction,y as updateRecord,$ as upsertRecord};
