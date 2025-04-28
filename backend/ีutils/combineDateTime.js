export default function combineDateTime(dateStr, timeStr) { 
    const date = new Date(dateStr); 
    const [hours, minutes] = timeStr.split(':'); 
    date.setHours(Number(hours)); 
    date.setMinutes(Number(minutes)); 
    date.setSeconds(0); 
    
    const year = date.getFullYear(); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0'); 
    const hoursStr = String(date.getHours()).padStart(2, '0'); 
    const minutesStr = String(date.getMinutes()).padStart(2, '0'); 
    
    return `${year}-${month}-${day} ${hoursStr}:${minutesStr}:00`;
}