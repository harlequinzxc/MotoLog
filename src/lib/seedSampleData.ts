import { serviceItemId } from "@/data/serviceItems";
import { db, ensureSettings } from "@/lib/db";
import { createId } from "@/lib/id";
import { standardServiceItemsForVehicle } from "@/lib/serviceCatalog";
import { recalculateFuelLogs } from "@/utils/fuelMath";
import type { ExpenseRecord, FuelLog, ServiceItem, ServiceVisit, ServiceVisitItem, Vehicle } from "@/types";

function iso(year:number,month:number,day:number){return new Date(year,month,day,12).toISOString()}
function vehicle(id:string,name:string,type:Vehicle["type"],fuelType:Vehicle["fuelType"],tank:number,odo:number,createdAt:string):Vehicle{return{id,name,type,fuelType,tankCapacityLitres:tank,currentOdometerKm:odo,distanceUnit:"km",volumeUnit:"liters",consumptionUnit:"km-per-litre",currencyCode:"SGD",createdAt,updatedAt:createdAt}}
function fuel(vehicleId:string,date:string,odo:number,litres:number|null,cost:number|null,currencyCode:string,stationName:string,mode:FuelLog["mode"],notes:string):FuelLog{const occurredAt=new Date(`${date}T12:00:00`).toISOString();return{id:createId("fuel"),vehicleId,occurredAt,odometerKm:odo,activeFuel:"petrol",mode,pricePerLitre:null,volumeLitres:litres,totalCost:cost,currencyCode,stationName,notes,distanceKm:null,efficiencyKmPerLitre:null,createdAt:occurredAt,updatedAt:occurredAt}}
function standardItems(vehicle:Vehicle,timestamp:string):ServiceItem[]{return standardServiceItemsForVehicle(vehicle,timestamp)}

export async function seedSampleData(){
 if(await db.vehicles.count())return;
 const createdAt=iso(2026,5,1),mt15Id=createId("vehicle"),civicId=createId("vehicle");
 const mt15=vehicle(mt15Id,"Yamaha MT-15","motorcycle","petrol",10,18534,createdAt), civic=vehicle(civicId,"Honda Civic FD4","car","petrol",50,104920,createdAt);
 const mt15Logs=[fuel(mt15Id,"2026-06-04",17240,8.9,32.06,"SGD","Shell","full","Baseline fill."),fuel(mt15Id,"2026-06-18",17510,4.1,14.84,"SGD","Esso","partial","Quick top-up."),fuel(mt15Id,"2026-06-30",17706,5.7,20.52,"SGD","SPC","full","Full after partial."),fuel(mt15Id,"2026-07-13",17966,8.7,31.49,"SGD","Caltex","full","Weekend city ride."),fuel(mt15Id,"2026-07-28",18230,8.5,30.77,"SGD","Sinopec","full","Regular commute refill."),fuel(mt15Id,"2026-08-15",18534,9,32.58,"SGD","Shell","full","Morning pump stop.")];
 const civicLogs=[fuel(civicId,"2026-06-03",103440,41.2,148.32,"SGD","Shell","full","Baseline fill."),fuel(civicId,"2026-06-22",103882,44.5,160.20,"SGD","Esso","full","Business visit day."),fuel(civicId,"2026-07-05",104298,39.6,81.18,"MYR","Petronas","full","Johor weekend trip."),fuel(civicId,"2026-07-19",104570,16,57.76,"SGD","SPC","partial","Short local top-up."),fuel(civicId,"2026-08-03",104810,34.9,74.74,"MYR","Petronas","full","Malaysia full fill after partial."),fuel(civicId,"2026-08-22",104920,11.3,40.78,"SGD","Caltex","partial","Pre-weekend top-up.")];
 const items=[...standardItems(mt15,createdAt),...standardItems(civic,createdAt)];
 const serviceVisit:ServiceVisit={id:createId("service-visit"),vehicleId:mt15Id,occurredAt:iso(2026,6,8),odometerKm:17920,totalCost:86,currencyCode:"SGD",notes:"Oil, filter, and chain inspection.",createdAt,updatedAt:createdAt};
 const links:ServiceVisitItem[]=["motorcycle-engine-oil","motorcycle-oil-filter","motorcycle-chain-sprocket"].map(key=>({id:createId("service-link"),visitId:serviceVisit.id,serviceItemId:serviceItemId(mt15Id,key),createdAt}));
 const expenses:ExpenseRecord[]=[{id:createId("expense"),vehicleId:civicId,occurredAt:iso(2026,6,8),category:"tolls-erp",totalCost:6.5,currencyCode:"SGD",odometerKm:103650,notes:"Business client route.",createdAt,updatedAt:createdAt},{id:createId("expense"),vehicleId:civicId,occurredAt:iso(2026,6,8),category:"parking",totalCost:12,currencyCode:"SGD",odometerKm:103650,notes:"Client-site parking.",createdAt,updatedAt:createdAt}];
 await db.transaction("rw",db.vehicles,db.fuelLogs,db.serviceItems,db.serviceVisits,db.serviceVisitItems,db.expenseRecords,db.settings,async()=>{await db.vehicles.bulkAdd([mt15,civic]);await db.fuelLogs.bulkAdd([...recalculateFuelLogs(mt15Logs),...recalculateFuelLogs(civicLogs)]);await db.serviceItems.bulkAdd(items);await db.serviceVisits.add(serviceVisit);await db.serviceVisitItems.bulkAdd(links);await db.expenseRecords.bulkAdd(expenses);const settings=await ensureSettings();await db.settings.update(settings.id,{activeVehicleId:mt15Id,updatedAt:new Date().toISOString()})});
}
