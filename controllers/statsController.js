const Order = require('../models/Order');

// @desc    Get revenue chart data grouped by day
// @route   GET /api/stats/revenue-chart
// @access  Private/Staff
exports.getRevenueChart = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp startDate và endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          orderStatus: 'completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: '+07:00' } },
          revenue: { $sum: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const result = await Order.aggregate(pipeline);
    
    const chartData = result.map(item => ({
      date: item._id,
      revenue: item.revenue
    }));

    res.status(200).json({ success: true, data: chartData });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};

// @desc    Get sold cars statistics in date range
// @route   GET /api/stats/by-car
// @access  Private/Staff
exports.getRevenueByCar = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp startDate và endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          orderStatus: 'completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: {
          path: '$carDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'carDetails.brand',
          foreignField: '_id',
          as: 'brandDetails'
        }
      },
      {
        $unwind: {
          path: '$brandDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          carName: { $ifNull: ['$carDetails.name', '$carInfo.name'] },
          brand: { $ifNull: ['$brandDetails.name', '$carInfo.brand'] },
          price: '$total',
          completedAt: '$completedAt'
        }
      },
      {
        $sort: { completedAt: -1 }
      }
    ];

    const result = await Order.aggregate(pipeline);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
};
