const mongoose = require('mongoose');
const User = require('./models/User');
const Car = require('./models/Car');
const Brand = require('./models/Brand');
const Category = require('./models/Category');
const Collection = require('./models/Collection');
const Coupon = require('./models/Coupon');
const Appointment = require('./models/Appointment');
const Deposit = require('./models/Deposit');
const SiteSetting = require('./models/SiteSetting');
const generateSlug = require('./utils/generateSlug');
const generateOrderCode = require('./utils/generateOrderCode');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/supercar_luxury';

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Clearing old collections...');

    // Delete existing records
    await User.deleteMany();
    await Car.deleteMany();
    await Brand.deleteMany();
    await Category.deleteMany();
    await Collection.deleteMany();
    await Coupon.deleteMany();
    await Appointment.deleteMany();
    await Deposit.deleteMany();
    await SiteSetting.deleteMany();

    console.log('Database cleared. Seeding users...');

    // 1. Seed Users
    const users = await User.create([
      {
        fullName: 'Hệ thống Quản Trị Viên',
        username: 'admin',
        email: 'admin@supercarluxury.vn',
        phone: '0988888888',
        address: '88 Lê Văn Lương, Hà Nội',
        password: 'Admin@123',
        role: 'admin',
        isActive: true
      },
      {
        fullName: 'Nhân Viên Tư Vấn',
        username: 'staff',
        email: 'staff@supercarluxury.vn',
        phone: '0977777777',
        address: 'Showroom Q7, TP. Hồ Chí Minh',
        password: 'Staff@123',
        role: 'staff',
        isActive: true
      },
      {
        fullName: 'Nguyễn Minh Anh',
        username: 'khach1',
        email: 'khach1@gmail.com',
        phone: '0911111111',
        address: 'Bình Thạnh, TP. Hồ Chí Minh',
        password: 'User@123',
        role: 'user',
        isActive: true
      }
    ]);

    const adminUser = users[0];
    const staffUser = users[1];
    const normalUser = users[2];

    console.log('Users seeded. Seeding brands...');

    // 2. Seed Brands
    const brandData = [
      { name: 'Lamborghini', country: 'Italy', description: 'Italian manufacturer of luxury sports cars and SUVs.', logo: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=200&q=80', sortOrder: 1 },
      { name: 'Ferrari', country: 'Italy', description: 'Italian luxury sports car manufacturer based in Maranello.', logo: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=200&q=80', sortOrder: 2 },
      { name: 'Porsche', country: 'Germany', description: 'German automobile manufacturer specializing in high-performance sports cars.', logo: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=200&q=80', sortOrder: 3 },
      { name: 'McLaren', country: 'United Kingdom', description: 'British creator of luxury, high-performance supercars.', logo: 'https://images.unsplash.com/photo-1566008889980-2a5482312b2e?auto=format&fit=crop&w=200&q=80', sortOrder: 4 },
      { name: 'Mercedes-AMG', country: 'Germany', description: 'High-performance subsidiary of Mercedes-Benz.', logo: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=200&q=80', sortOrder: 5 },
      { name: 'BMW M', country: 'Germany', description: 'High-performance division of BMW.', logo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=200&q=80', sortOrder: 6 },
      { name: 'Aston Martin', country: 'United Kingdom', description: 'British manufacturer of luxury sports cars and grand tourers.', logo: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=200&q=80', sortOrder: 7 },
      { name: 'Bentley', country: 'United Kingdom', description: 'British manufacturer and marketer of luxury cars and SUVs.', logo: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=200&q=80', sortOrder: 8 }
    ];

    const seededBrands = [];
    for (const b of brandData) {
      const created = await Brand.create({ ...b, slug: generateSlug(b.name) });
      seededBrands.push(created);
    }

    const lambo = seededBrands[0];
    const ferrari = seededBrands[1];
    const porsche = seededBrands[2];
    const mclaren = seededBrands[3];
    const amg = seededBrands[4];
    const bmwm = seededBrands[5];
    const aston = seededBrands[6];
    const bentley = seededBrands[7];

    console.log('Brands seeded. Seeding categories...');

    // 3. Seed Categories
    const categoryData = [
      { name: 'Supercar', description: 'Sleek luxury vehicles with outstanding acceleration and racing lineage.', image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=400&q=80', sortOrder: 1 },
      { name: 'Hypercar', description: 'Extreme limited-production masterpieces with over 1000 horsepower.', image: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&w=400&q=80', sortOrder: 2 },
      { name: 'Luxury SUV', description: 'Premium all-terrain vehicles combining ultimate performance with spacious comfort.', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80', sortOrder: 3 },
      { name: 'Coupe', description: 'Sporty two-door luxury cars designed for driver comfort.', image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80', sortOrder: 4 },
      { name: 'Convertible', description: 'Open-top high performance cruisers for premium outdoor motoring.', image: 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?auto=format&fit=crop&w=400&q=80', sortOrder: 5 },
      { name: 'Sedan hạng sang', description: 'Full-sized premium executive saloons with ultimate interior luxury.', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80', sortOrder: 6 }
    ];

    const seededCategories = [];
    for (const c of categoryData) {
      const created = await Category.create({ ...c, slug: generateSlug(c.name) });
      seededCategories.push(created);
    }

    const supercarCat = seededCategories[0];
    const hypercarCat = seededCategories[1];
    const suvCat = seededCategories[2];
    const coupeCat = seededCategories[3];
    const convCat = seededCategories[4];
    const sedanCat = seededCategories[5];

    console.log('Categories seeded. Seeding cars...');

    // 4. Seed Cars (10 vehicles with full configuration)
    const carData = [
      {
        code: 'CAR-001',
        name: 'Lamborghini Huracan EVO',
        brand: lambo._id,
        category: supercarCat._id,
        model: 'Huracan',
        version: 'EVO',
        year: 2021,
        bodyType: 'Coupe',
        price: 21500000000,
        oldPrice: 22000000000,
        depositAmount: 1000000000,
        images: [
          'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'new',
        mileage: 50,
        origin: 'Italy',
        showroom: 'Showroom Hà Nội',
        exteriorColor: 'Vàng Giallo',
        interiorColor: 'Đen Nero',
        interiorMaterial: 'Alcantara',
        engine: 'V10 5.2L',
        engineCapacity: '5204 cc',
        horsepower: 640,
        torque: 600,
        transmission: 'Tự động 7 cấp ly hợp kép',
        drivetrain: 'AWD',
        fuelType: 'Xăng',
        acceleration: '2.9 giây',
        maxSpeed: '325 km/h',
        seats: 2,
        options: ['Lifting System', 'Sensonum Sound System', 'Carbon Ceramic Brakes', 'Sport Exhaust'],
        safetyFeatures: ['ABS', 'Traction Control', 'Electronic Stability Control', 'Airbags'],
        entertainmentFeatures: ['Apple CarPlay', 'Android Auto', 'Touchscreen Infotainment', 'Bluetooth'],
        legalStatus: 'Sổ đỏ xe đầy đủ, nhập khẩu chính hãng',
        licensePlate: 'Chưa đăng ký',
        registrationStatus: 'Sẵn bàn giao làm thủ tục',
        inspectionStatus: 'Đã đăng kiểm',
        warranty: '3 năm không giới hạn số km',
        description: 'Lamborghini Huracán EVO là dòng siêu xe thể thao V10 thế hệ mới, tích hợp hệ thống kiểm soát động lực học LDVI mang lại trải nghiệm lái tối thượng.',
        allowTestDrive: true,
        isFeatured: true,
        status: 'available'
      },
      {
        code: 'CAR-002',
        name: 'Ferrari 488 Pista',
        brand: ferrari._id,
        category: supercarCat._id,
        model: '488',
        version: 'Pista',
        year: 2020,
        bodyType: 'Coupe',
        price: 18900000000,
        oldPrice: 19500000000,
        depositAmount: 1000000000,
        images: [
          'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'used',
        mileage: 4500,
        origin: 'Italy',
        showroom: 'Showroom TP.HCM',
        exteriorColor: 'Đỏ Rosso Corsa',
        interiorColor: 'Đen Nero',
        interiorMaterial: 'Carbon & Alcantara',
        engine: 'V8 3.9L Twin-Turbo',
        engineCapacity: '3902 cc',
        horsepower: 720,
        torque: 770,
        transmission: 'Tự động 7 cấp F1 ly hợp kép',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '2.85 giây',
        maxSpeed: '340 km/h',
        seats: 2,
        options: ['Carbon Fiber Steering Wheel', 'Telemetry System', 'Rosso Brake Calipers', 'Racing Seats'],
        safetyFeatures: ['F1-Trac', 'E-Diff3', 'Side Slip Angle Control', 'High-Performance Brembo ABS'],
        entertainmentFeatures: ['Radio System', 'Integrated Navigation', 'Premium Audio'],
        legalStatus: 'Xe cá nhân biển thành phố, sang tên ngay',
        licensePlate: '51G-888.88',
        registrationStatus: 'Đã hoàn tất đăng ký',
        inspectionStatus: 'Hạn đến 12/2026',
        warranty: 'Bảo hành chính hãng Ferrari Việt Nam đến 2025',
        description: 'Ferrari 488 Pista là sự kết hợp hoàn hảo giữa công nghệ xe đua F1 và xe thương mại, động cơ V8 mạnh mẽ nhất trong lịch sử hãng ngựa chồm.',
        allowTestDrive: false,
        isFeatured: true,
        status: 'available'
      },
      {
        code: 'CAR-003',
        name: 'Porsche 911 GT3 RS',
        brand: porsche._id,
        category: supercarCat._id,
        model: '911',
        version: 'GT3 RS',
        year: 2022,
        bodyType: 'Coupe',
        price: 15200000000,
        oldPrice: 15800000000,
        depositAmount: 800000000,
        images: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'new',
        mileage: 15,
        origin: 'Germany',
        showroom: 'Showroom Hà Nội',
        exteriorColor: 'Xanh Lizard Green',
        interiorColor: 'Đen Nero',
        interiorMaterial: 'Alcantara',
        engine: 'Flat-6 4.0L Hút khí tự nhiên',
        engineCapacity: '3996 cc',
        horsepower: 520,
        torque: 470,
        transmission: 'Tự động PDK 7 cấp',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '3.2 giây',
        maxSpeed: '312 km/h',
        seats: 2,
        options: ['Weissach Package', 'Magnesium Wheels', 'Ceramic Brakes PCCB', 'Roll Cage'],
        safetyFeatures: ['Porsche Stability Management (PSM)', 'Active Suspension (PASM)', 'Roll Cage Guard'],
        entertainmentFeatures: ['Porsche Communication Management (PCM)', 'Bose Surround Sound'],
        legalStatus: 'Hải quan cầm tay, sẵn sàng bấm biển',
        licensePlate: 'Chưa biển',
        registrationStatus: 'Nhập khẩu mới 100%',
        inspectionStatus: 'Chờ đăng kiểm',
        warranty: '4 năm chính hãng Porsche Việt Nam',
        description: 'Porsche 911 GT3 RS là chiếc xe đua đường phố đỉnh cao, động cơ nạp khí tự nhiên vòng tua lên tới 9.000 vòng/phút.',
        allowTestDrive: true,
        isFeatured: true,
        status: 'available'
      },
      {
        code: 'CAR-004',
        name: 'McLaren 720S Spider',
        brand: mclaren._id,
        category: convCat._id,
        model: '720S',
        version: 'Spider',
        year: 2019,
        bodyType: 'Convertible',
        price: 14500000000,
        oldPrice: 15000000000,
        depositAmount: 700000000,
        images: [
          'https://images.unsplash.com/photo-1566008889980-2a5482312b2e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'used',
        mileage: 12000,
        origin: 'United Kingdom',
        showroom: 'Showroom TP.HCM',
        exteriorColor: 'Cam Mclaren Orange',
        interiorColor: 'Đen Carbon',
        interiorMaterial: 'Da Nappa cao cấp',
        engine: 'V8 4.0L Twin-Turbo',
        engineCapacity: '3994 cc',
        horsepower: 720,
        torque: 770,
        transmission: 'Tự động 7 cấp ly hợp kép',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '2.9 giây',
        maxSpeed: '341 km/h',
        seats: 2,
        options: ['Carbon Fiber Monocage II-S', 'Carbon Fiber Exterior Pack', 'Bowers & Wilkins 12-speaker'],
        safetyFeatures: ['Active Aerodynamics', 'Variable Drift Control', 'Carbon Ceramic Disk ABS'],
        entertainmentFeatures: ['Folding Driver Display', 'McLaren Infotainment System'],
        legalStatus: 'Xe cá nhân, biển số thành phố đẹp',
        licensePlate: '51H-720.88',
        registrationStatus: 'Đầy đủ giấy tờ gốc',
        inspectionStatus: 'Đã hoàn tất kiểm định',
        warranty: 'Hết hạn bảo hành hãng (Hỗ trợ gói bảo dưỡng showroom 12 tháng)',
        description: 'McLaren 720S Spider mang lại trải nghiệm phấn khích mui trần cùng hiệu năng tối thượng nhờ khung gầm carbon siêu nhẹ.',
        allowTestDrive: false,
        isFeatured: false,
        status: 'reserved' // Reserving this car according to the specification
      },
      {
        code: 'CAR-005',
        name: 'Mercedes-AMG GT Black Series',
        brand: amg._id,
        category: supercarCat._id,
        model: 'GT',
        version: 'Black Series',
        year: 2022,
        bodyType: 'Coupe',
        price: 25000000000,
        oldPrice: 26000000000,
        depositAmount: 1500000000,
        images: [
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'imported',
        mileage: 100,
        origin: 'Germany',
        showroom: 'Showroom Hà Nội',
        exteriorColor: 'Cam Magma Beam',
        interiorColor: 'Đen & Cam',
        interiorMaterial: 'Alcantara & Carbon',
        engine: 'V8 4.0L Bi-Turbo Flat-Plane Crank',
        engineCapacity: '3982 cc',
        horsepower: 730,
        torque: 800,
        transmission: 'Tự động 7 cấp ly hợp kép',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '3.2 giây',
        maxSpeed: '325 km/h',
        seats: 2,
        options: ['Carbon Fiber Wing Active', 'Adjustable Coilovers', 'Carbon Brakes', 'Amg Track Pace'],
        safetyFeatures: ['AMG Traction Control 9-stages', 'Pre-Safe System', 'Active Brake Assist'],
        entertainmentFeatures: ['Burmester Surround Sound', 'Digital Instrument Cluster'],
        legalStatus: 'Xe nhập Hải quan chính ngạch mới tinh',
        licensePlate: 'Chưa bấm',
        registrationStatus: 'Đầy đủ tờ khai nhập khẩu',
        inspectionStatus: 'Chờ đăng kiểm lần đầu',
        warranty: '2 năm bảo hành động cơ tại showroom',
        description: 'Mercedes-AMG GT Black Series đại diện cho đỉnh cao hiệu năng của gia đình AMG, xe kỷ lục Nurburgring năm sản xuất.',
        allowTestDrive: false,
        isFeatured: true,
        status: 'available'
      },
      {
        code: 'CAR-006',
        name: 'BMW M8 Competition Gran Coupe',
        brand: bmwm._id,
        category: sedanCat._id,
        model: 'M8',
        version: 'Competition',
        year: 2021,
        bodyType: 'Sedan',
        price: 8900000000,
        oldPrice: 9300000000,
        depositAmount: 500000000,
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'used',
        mileage: 8000,
        origin: 'Germany',
        showroom: 'Showroom TP.HCM',
        exteriorColor: 'Xám Sonic Speed',
        interiorColor: 'Đỏ Sakhir',
        interiorMaterial: 'Da Merino cao cấp',
        engine: 'V8 4.4L TwinPower Turbo',
        engineCapacity: '4395 cc',
        horsepower: 625,
        torque: 750,
        transmission: 'M Steptronic 8 cấp',
        drivetrain: 'M xDrive AWD',
        fuelType: 'Xăng',
        acceleration: '3.2 giây',
        maxSpeed: '305 km/h',
        seats: 5,
        options: ['M Carbon Ceramic Brakes', 'Bowers & Wilkins Diamond Surround', 'Night Vision'],
        safetyFeatures: ['Driving Assistant Professional', 'Parking Assistant Plus', 'Laserlight'],
        entertainmentFeatures: ['Live Cockpit Professional', 'Rear seat entertainment screen'],
        legalStatus: 'Chính chủ biển Hà Nội đẹp, bao rút hồ sơ',
        licensePlate: '30H-999.66',
        registrationStatus: 'Đầy đủ sổ đăng kiểm',
        inspectionStatus: 'Đến hết 2026',
        warranty: 'Hỗ trợ bảo dưỡng định kỳ 2 năm tại showroom',
        description: 'BMW M8 Competition là sự hòa quyện tuyệt đỉnh giữa sức mạnh của xe thể thao M Power và không gian sang trọng đẳng cấp thượng lưu.',
        allowTestDrive: true,
        isFeatured: false,
        status: 'available'
      },
      {
        code: 'CAR-007',
        name: 'Aston Martin Vantage Coupe',
        brand: aston._id,
        category: coupeCat._id,
        model: 'Vantage',
        version: 'Coupe',
        year: 2020,
        bodyType: 'Coupe',
        price: 12300000000,
        oldPrice: 12800000000,
        depositAmount: 600000000,
        images: [
          'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1614200187524-dc5b8ec2229a?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'consignment',
        mileage: 6500,
        origin: 'United Kingdom',
        showroom: 'Showroom Hà Nội',
        exteriorColor: 'Xanh Aston Racing Green',
        interiorColor: 'Nâu Tan Leather',
        interiorMaterial: 'Da Strathmore',
        engine: 'V8 4.0L Bi-Turbo',
        engineCapacity: '3982 cc',
        horsepower: 510,
        torque: 685,
        transmission: 'ZF 8 cấp tự động',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '3.6 giây',
        maxSpeed: '314 km/h',
        seats: 2,
        options: ['Carbon Fiber Exterior Pack', '20-inch Gloss Black Alloy Wheels', 'Aston Martin Premium Audio'],
        safetyFeatures: ['Electronic Rear Differential', 'Dynamic Torque Vectoring', 'Carbon Brakes'],
        entertainmentFeatures: ['Aston Martin Infotainment System', 'Navigation & Bluetooth'],
        legalStatus: 'Xe ký gửi của khách VIP, sang tên 1 nốt nhạc',
        licensePlate: '30F-555.79',
        registrationStatus: 'Đã hoàn tất nghĩa vụ thuế',
        inspectionStatus: 'Đăng kiểm còn 1 năm',
        warranty: 'Hỗ trợ gói bảo hiểm xe cũ 6 tháng',
        description: 'Aston Martin Vantage mang vẻ đẹp quý tộc Anh Quốc, sở hữu trái tim V8 Mercedes-AMG đầy cơ bắp và uy lực.',
        allowTestDrive: false,
        isFeatured: false,
        status: 'sold' // Sold according to specification
      },
      {
        code: 'CAR-008',
        name: 'Bentley Continental GT V8',
        brand: bentley._id,
        category: coupeCat._id,
        model: 'Continental GT',
        version: 'V8',
        year: 2022,
        bodyType: 'Coupe',
        price: 22000000000,
        oldPrice: 22800000000,
        depositAmount: 1200000000,
        images: [
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'new',
        mileage: 20,
        origin: 'United Kingdom',
        showroom: 'Showroom TP.HCM',
        exteriorColor: 'Xanh British Racing Green',
        interiorColor: 'Kem Mulliner',
        interiorMaterial: 'Gỗ Walnut & Da Nappa',
        engine: 'V8 4.0L Twin-Turbo',
        engineCapacity: '3996 cc',
        horsepower: 550,
        torque: 770,
        transmission: 'Tự động 8 cấp ly hợp kép',
        drivetrain: 'Active All-Wheel Drive',
        fuelType: 'Xăng',
        acceleration: '4.0 giây',
        maxSpeed: '318 km/h',
        seats: 4,
        options: ['Bentley Rotating Display', 'Naim for Bentley premium sound system', 'Mulliner Driving Specification', 'Dual Veneer wood trim'],
        safetyFeatures: ['Bentley Safeguard Plus', 'Night Vision System', 'Adaptive Cruise Control'],
        entertainmentFeatures: ['Rotating Touchscreen 12.3-inch', 'Apple CarPlay Integration'],
        legalStatus: 'Xe chính hãng mới 100%, sẵn hồ sơ thông quan',
        licensePlate: 'Chưa bấm biển',
        registrationStatus: 'Đang làm thủ tục hải quan',
        inspectionStatus: 'Chờ kiểm định đăng ký mới',
        warranty: '3 năm bảo hành Mulliner toàn cầu',
        description: 'Bentley Continental GT V8 mang lại trải nghiệm du ngoạn xa hoa bậc nhất, là chuẩn mực dòng xe Grand Tourer quý tộc.',
        allowTestDrive: true,
        isFeatured: true,
        status: 'available'
      },
      {
        code: 'CAR-009',
        name: 'Lamborghini Urus Pearl Capsule',
        brand: lambo._id,
        category: suvCat._id,
        model: 'Urus',
        version: 'Pearl Capsule',
        year: 2021,
        bodyType: 'SUV',
        price: 17500000000,
        oldPrice: 18200000000,
        depositAmount: 1000000000,
        images: [
          'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'used',
        mileage: 9500,
        origin: 'Italy',
        showroom: 'Showroom Hà Nội',
        exteriorColor: 'Xanh Lá Verde Mantis',
        interiorColor: 'Đen & Xanh',
        interiorMaterial: 'Alcantara & Carbon Fiber',
        engine: 'V8 4.0L Bi-Turbo',
        engineCapacity: '3996 cc',
        horsepower: 650,
        torque: 850,
        transmission: 'Tự động 8 cấp',
        drivetrain: 'AWD',
        fuelType: 'Xăng',
        acceleration: '3.6 giây',
        maxSpeed: '305 km/h',
        seats: 5,
        options: ['Taigete 23-inch Shiny Black wheels', 'Carbon Fiber Interior Trim', 'Panoramic Roof', 'Bang & Olufsen 3D Advanced'],
        safetyFeatures: ['ADAS package with Highway Assist', 'Active Anti-Roll Bar', 'Brembo Carbon Brakes'],
        entertainmentFeatures: ['Lambo Infotainment System III', 'Head-Up Display'],
        legalStatus: 'Xe cá nhân biển số Hà Nội, sang tên nhanh',
        licensePlate: '30G-969.96',
        registrationStatus: 'Đầy đủ sổ kiểm định',
        inspectionStatus: 'Có hạn tới 06/2026',
        warranty: 'Hỗ trợ gói bảo dưỡng 1 năm chính hãng',
        description: 'Lamborghini Urus Pearl Capsule là mẫu Super SUV sang trọng hàng đầu, khoác lên mình gói thiết kế ngoại thất độc quyền Pearl Capsule rực rỡ.',
        allowTestDrive: true,
        isFeatured: false,
        status: 'available'
      },
      {
        code: 'CAR-010',
        name: 'Ferrari Roma Coupe',
        brand: ferrari._id,
        category: coupeCat._id,
        model: 'Roma',
        version: 'Coupe',
        year: 2022,
        bodyType: 'Coupe',
        price: 16800000000,
        oldPrice: 17300000000,
        depositAmount: 900000000,
        images: [
          'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
        ],
        videoUrl: 'https://www.youtube.com/embed/5a2d0L82F0U',
        condition: 'new',
        origin: 'Italy',
        showroom: 'Showroom TP.HCM',
        exteriorColor: 'Xám Grigio Silverstone',
        interiorColor: 'Đỏ Bordeaux',
        interiorMaterial: 'Da Frau cao cấp',
        engine: 'V8 3.9L Twin-Turbo',
        engineCapacity: '3855 cc',
        horsepower: 620,
        torque: 760,
        transmission: 'Tự động 8 cấp ly hợp kép',
        drivetrain: 'RWD',
        fuelType: 'Xăng',
        acceleration: '3.4 giây',
        maxSpeed: '320 km/h',
        seats: 4,
        options: ['Passenger Display', 'Matrix LED Headlights', 'Magneride Dual Mode Suspension', 'Active rear spoiler'],
        safetyFeatures: ['Side Slip Control 6.0', 'Adaptive Cruise Control', 'Autonomous Emergency Braking'],
        entertainmentFeatures: ['8.4-inch portrait central display', 'Premium Audio System'],
        legalStatus: 'Xe chính hãng đang cập cảng Hải Phòng',
        licensePlate: 'Chưa có',
        registrationStatus: 'Đang chờ làm thủ tục thông quan',
        inspectionStatus: 'Chờ đăng kiểm mới',
        warranty: '3 năm bảo hành chính hãng Ferrari toàn quốc',
        description: 'Ferrari Roma tái hiện phong cách sống La Dolce Vita phóng khoáng tự do của Ý những năm 1950 - 1960 trong một hình dáng coupe grand tourer lịch lãm.',
        allowTestDrive: false,
        isFeatured: false,
        status: 'coming_soon' // Coming Soon according to specs
      }
    ];

    const seededCars = [];
    for (const car of carData) {
      const created = await Car.create({ ...car, slug: generateSlug(car.name) });
      seededCars.push(created);
    }

    const huracan = seededCars[0];
    const pista = seededCars[1];
    const gt3rs = seededCars[2];
    const spider720s = seededCars[3];
    const gtBlackSeries = seededCars[4];
    const continentalGtv8 = seededCars[7];

    console.log('Cars seeded. Seeding collections...');

    // 5. Seed Collections
    const collectionData = [
      {
        name: 'Lamborghini Collection',
        description: 'Những con bò tót dũng mãnh nhất đến từ hành tinh Sant\'Agata Bolognese.',
        image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=80',
        cars: [seededCars[0]._id, seededCars[8]._id],
        isActive: true
      },
      {
        name: 'Ferrari Performance',
        description: 'Tốc độ, lịch sử và cảm xúc nồng cháy mang sắc đỏ Maranello.',
        image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80',
        cars: [seededCars[1]._id, seededCars[9]._id],
        isActive: true
      },
      {
        name: 'Xe Thể Thao Mui Trần',
        description: 'Tận hưởng ánh nắng và gió trời lướt qua mái tóc của bạn.',
        image: 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?auto=format&fit=crop&w=800&q=80',
        cars: [seededCars[3]._id],
        isActive: true
      }
    ];

    const seededCollections = [];
    for (const col of collectionData) {
      const created = await Collection.create({ ...col, slug: generateSlug(col.name) });
      seededCollections.push(created);
    }

    console.log('Collections seeded. Seeding coupons...');

    // 6. Seed Coupons
    const coupons = await Coupon.create([
      {
        code: 'SUPER10',
        name: 'Ưu đãi siêu xe hè 2026',
        discountType: 'percent',
        discountValue: 10, // 10%
        minOrderValue: 5000000000,
        maxDiscount: 2000000000, // Max 2 tỷ
        usageLimit: 5,
        isActive: true,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      },
      {
        code: 'LUXURY500',
        name: 'Đại tiệc xe sang',
        discountType: 'fixed',
        discountValue: 500000000, // 500 triệu
        minOrderValue: 10000000000,
        usageLimit: 10,
        isActive: true,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15)
      },
      {
        code: 'PORSCHE5',
        name: 'Tri ân khách hàng Porsche',
        discountType: 'percent',
        discountValue: 5, // 5%
        minOrderValue: 8000000000,
        applyBrand: 'Porsche',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
      }
    ]);

    console.log('Coupons seeded. Seeding transactions...');

    // 7. Seed 1 Sample Pending Appointment
    await Appointment.create({
      user: normalUser._id,
      car: huracan._id,
      customerInfo: {
        fullName: normalUser.fullName,
        phone: normalUser.phone,
        email: normalUser.email,
        note: 'Muốn xem xe màu vàng thực tế tại showroom Hà Nội.'
      },
      showroom: 'Showroom Hà Nội',
      appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      appointmentTime: '10:00',
      groupSize: 2,
      status: 'pending'
    });

    // 8. Seed 1 Sample Confirmed Deposit for McLaren 720S
    const expiryDays = parseInt(process.env.DEPOSIT_EXPIRY_DAYS || '7', 10);
    await Deposit.create({
      depositCode: generateOrderCode('DEP'),
      user: normalUser._id,
      car: spider720s._id,
      customerInfo: {
        fullName: normalUser.fullName,
        phone: normalUser.phone,
        email: normalUser.email,
        note: 'Đã chuyển cọc giữ xe mui trần Spider.'
      },
      depositAmount: spider720s.depositAmount,
      paymentMethod: 'bank_transfer',
      paymentProof: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80',
      status: 'confirmed',
      expiredAt: new Date(Date.now() + expiryDays * 86400000),
      handledBy: staffUser._id,
      staffNote: 'Đã nhận đủ tiền cọc qua tài khoản Techcombank Showroom.'
    });

    console.log('Transactions seeded. Seeding site settings...');

    // 9. Site settings configuration
    await SiteSetting.create({
      hero: {
        title: 'Sở hữu siêu xe mơ ước của bạn',
        subtitle: 'SuperCar Luxury',
        description: 'Hệ thống showroom phân phối các mẫu siêu xe, xe thể thao, hypercar đẳng cấp hàng đầu Việt Nam. Minh bạch pháp lý, hỗ trợ tư vấn 24/7 và giao xe tại nhà.',
        buttonText: 'Khám Phá Showroom',
        buttonLink: '/views/cars.html',
        image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1920&q=80',
        isVisible: true
      },
      featuredCars: [huracan._id, pista._id, gt3rs._id, gtBlackSeries._id],
      featuredCollections: {
        title: 'Khám Phá Theo Bộ Sưu Tập',
        subtitle: 'Lựa chọn phong cách thượng lưu phù hợp với cá tính của riêng bạn',
        collections: [seededCollections[0]._id, seededCollections[1]._id],
        isVisible: true
      },
      aboutSection: {
        title: 'Tại Sao Chọn SuperCar Luxury?',
        subtitle: 'Uy tín kiến tạo niềm tin',
        description: 'Chúng tôi hiểu rằng mỗi chiếc siêu xe không chỉ là phương tiện di chuyển, mà còn là một tác phẩm nghệ thuật khẳng định vị thế chủ nhân. Với quy trình kiểm định 150 bước, pháp lý minh bạch tuyệt đối và dịch vụ chăm sóc hậu mãi tiêu chuẩn 6 sao, SuperCar Luxury là điểm đến đáng tin cậy của các tín đồ tốc độ.',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        isVisible: true
      }
    });

    console.log('Site settings seeded.');
    console.log('Seeding Database Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding database error:', err);
    process.exit(1);
  }
};

seedData();
