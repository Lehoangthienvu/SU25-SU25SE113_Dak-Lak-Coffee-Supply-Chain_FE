import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/v2/p/66?depth=2');
    const data = await response.json();
    
    // Lọc chỉ các địa danh thực sự của Đắk Lắk (có tên bắt đầu bằng Ea, Buôn, Krông, Cư, etc.)
    const dakLakWards = data.wards.filter((ward: any) => {
      const name = ward.name.toLowerCase();
      return name.includes('ea') || 
             name.includes('buôn') || 
             name.includes('krông') || 
             name.includes('cư') || 
             name.includes('đắk') ||
             name.includes('dang') ||
             name.includes('yang') ||
             name.includes('m\'drắk') ||
             name.includes('dray') ||
             name.includes('dur') ||
             name.includes('liên sơn') ||
             name.includes('nam ka');
    });
    
    const wards = dakLakWards.map((ward: any) => ({
      address: `${ward.name}, Đắk Lắk`,
      name: ward.name,
      code: ward.code,
      divisionType: ward.division_type,
      codename: ward.codename
    }));
    
    return NextResponse.json(wards);
  } catch (error) {
    console.error('Error fetching DakLak wards:', error);
    return NextResponse.json({ error: 'Failed to fetch wards' }, { status: 500 });
  }
}
