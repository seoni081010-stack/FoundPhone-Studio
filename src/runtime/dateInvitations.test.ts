import { afterEach, expect, test, vi } from "vitest";
import { canInvite, invitationPools, invitationReply, dateInvitationKey, readDateInvitations, saveDateInvitations } from "./dateInvitations";
import dates from "../../stories/template/hogwarts-dates.json";
import { routeDateContent } from "./routeDateContent";

afterEach(() => vi.unstubAllGlobals());
test.each(Object.keys(invitationPools))("%s shares the strict >45 gate and draws from the proper pool at every venue", lead => {
  const pool = invitationPools[lead];
  expect(pool.accepts).toHaveLength(4);
  expect(pool.declines).toHaveLength(4);
  for (const venue of dates.venues) for (const affinity of [0,44,45,46,100]) for (let slot=0;slot<4;slot++) {
    const random=vi.fn(()=> (slot+0.5)/4);
    const result=invitationReply(lead,affinity,venue.id,1,random);
    expect(result).toEqual({accepted:affinity>45, reply:pool[affinity>45?"accepts":"declines"][slot]});
    expect(random).toHaveBeenCalledTimes(1);
  }
});

test("random draws are per invitation, not a daily or venue-based rotation", () => {
  const random=vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(.99).mockReturnValueOnce(0);
  const replies=Array.from({length:3},()=>invitationReply("younghoon",46,"puddifoot",1,random)?.reply);
  expect(replies).toEqual([invitationPools.younghoon.accepts[0],invitationPools.younghoon.accepts[3],invitationPools.younghoon.accepts[0]]);
});

test("Hyunjae retains existing venue replies and threshold; unauthored routes stay unavailable", () => {
  for(const venue of dates.venues) {
    expect(invitationReply("hyunjae",46,venue.id,1)?.reply).toBe(routeDateContent.hyunjae.venues[venue.id].reply);
    expect(invitationReply("hyunjae",45,venue.id,1)?.accepted).toBe(false);
  }
  expect(canInvite("eric","puddifoot")).toBe(false);
  expect(invitationReply("younghoon",100,"unknown",1)).toBeUndefined();
});

test("chosen replies, accepted plans and attendance restore without drawing again, isolated by run and lead", () => {
  const store=new Map<string,string>();
  vi.stubGlobal("localStorage",{getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>store.set(key,value)});
  const key=dateInvitationKey("run-a","younghoon");
  const save={invitations:[{recipient:"younghoon",day:1,date:5,venue:"puddifoot",venueName:"帕笛芙夫人茶馆",accepted:true,reply:invitationPools.younghoon.accepts[3],order:0}],attended:[5]};
  saveDateInvitations(key,save);
  expect(readDateInvitations(key)).toEqual(save);
  expect(readDateInvitations(dateInvitationKey("run-b","younghoon")).invitations).toEqual([]);
  expect(readDateInvitations(dateInvitationKey("run-a","q")).invitations).toEqual([]);
  store.set(key,"broken");expect(readDateInvitations(key)).toEqual({invitations:[],attended:[]});
});
