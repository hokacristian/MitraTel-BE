const prisma = require("../configs/prisma");

const createTower = async (req, res) => {
  try {
    const { nama, latitude, longitude, wilayahId } = req.body;

    if (!nama || !latitude || !longitude || !wilayahId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if wilayah exists
    const wilayah = await prisma.wilayah.findUnique({
      where: { id: parseInt(wilayahId) },
    });

    if (!wilayah) {
      return res.status(404).json({ message: "Wilayah not found" });
    }

    const tower = await prisma.tower.create({
      data: {
        nama,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        wilayahId: parseInt(wilayahId),
      },
    });

    res.status(201).json({
      message: "Tower created successfully",
      data: tower,
    });
  } catch (error) {
    console.error("Error in createTower:", error);
    res
      .status(500)
      .json({ message: "Failed to create tower", error: error.message });
  }
};

const getAllTowers = async (req, res) => {
  try {
    const { wilayahId } = req.query;

    const whereClause = {};
    if (wilayahId) {
      whereClause.wilayahId = parseInt(wilayahId);
    }

    // Get all towers with basic info
    const towers = await prisma.tower.findMany({
      where: whereClause,
      include: {
        wilayah: true,
      },
    });

    // Enhance towers with status, complete_progress, dan technicianName
    const enhancedTowers = await Promise.all(
      towers.map(async (tower) => {
        let kebersihanLatest = null;
        let kondisiTowerLatest = null;
        let perangkatLatest = null;
        let teganganLatest = null;

        // 1. Ambil data terakhir dari setiap kategori
        try {
          kebersihanLatest = await prisma.kebersihanSite.findFirst({
            where: { towerId: tower.id },
            orderBy: { createdAt: "desc" },
            select: {
              user: { select: { name: true } },
              createdAt: true
            }
          });
        } catch (error) {
          console.error(`Error fetching kebersihan for tower ${tower.id}:`, error);
        }

        try {
          kondisiTowerLatest = await prisma.kondisiTower.findFirst({
            where: { 
              towerId: tower.id,
              status: "COMPLETED" 
            },
            orderBy: { createdAt: "desc" },
            select: {
              user: { select: { name: true } },
              createdAt: true
            }
          });
        } catch (error) {
          console.error(`Error fetching kondisi tower for tower ${tower.id}:`, error);
        }

        try {
          perangkatLatest = await prisma.perangkatAntenna.findFirst({
            where: { towerId: tower.id },
            orderBy: { createdAt: "desc" },
            select: {
              user: { select: { name: true } },
              createdAt: true
            }
          });
        } catch (error) {
          console.error(`Error fetching perangkat for tower ${tower.id}:`, error);
        }

        try {
          if (prisma.teganganListrik) {
            teganganLatest = await prisma.teganganListrik.findFirst({
              where: { towerId: tower.id },
              orderBy: { createdAt: "desc" },
              select: {
                user: { select: { name: true } },
                createdAt: true
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching tegangan for tower ${tower.id}:`, error);
        }

        // 2. Hitung complete_progress
        let complete_progress = 0;
        if (kebersihanLatest) complete_progress++;
        if (kondisiTowerLatest) complete_progress++;
        if (perangkatLatest) complete_progress++;
        if (teganganLatest) complete_progress++;

        // 3. Tentukan status
        let status = "pending";
        if (complete_progress > 0 && complete_progress < 4) {
          status = "in_progress";
        } else if (complete_progress === 4) {
          status = "completed";
        }

        // 4. Cari teknisi terakhir
        const allLatest = [
          kebersihanLatest, 
          kondisiTowerLatest, 
          perangkatLatest, 
          teganganLatest
        ].filter(Boolean);

        let latestRecord = null;
        if (allLatest.length > 0) {
          latestRecord = allLatest.reduce((latest, current) => {
            return new Date(current.createdAt) > new Date(latest.createdAt) 
              ? current 
              : latest;
          });
        }

        const technicianName = latestRecord?.user?.name || "Unknown";

        return {
          ...tower,
          status,
          complete_progress,
          technicianName // Tambahkan field ini
        };
      })
    );

    res.status(200).json({
      message: "Towers retrieved successfully",
      data: enhancedTowers,
    });
  } catch (error) {
    console.error("Error in getAllTowers:", error);
    res.status(500).json({ 
      message: "Failed to retrieve towers", 
      error: error.message 
    });
  }
};

const getTowerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id exists and is a valid number
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Valid tower ID is required" });
    }

    const towerId = parseInt(id);

    // Try to get the basic tower data first
    let tower;
    try {
      tower = await prisma.tower.findUnique({
        where: { id: towerId },
        include: {
          wilayah: true,
        },
      });
    } catch (dbError) {
      console.error("Database error fetching tower:", dbError);
      return res.status(503).json({ 
        message: "Database connection issue", 
        error: dbError.message 
      });
    }

    if (!tower) {
      return res.status(404).json({ message: "Tower not found" });
    }

    // Default values
    let status = "pending";
    let complete_progress = 0;
    let lastInspectionDate = null;
    let inspectionDate = null;
    let technicianName = null;
    const latestData = {
      kebersihan: null,
      perangkat: null,
      tegangan: null,
      kondisiTower: null
    };

    // Use individual try/catch blocks for each data category
    try {
      const latestKebersihan = await prisma.kebersihanSite.findFirst({
        where: { towerId },
        orderBy: { createdAt: "desc" },
        include: {
          fotos: true, // Include photos
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      latestData.kebersihan = latestKebersihan;
      if (latestKebersihan) complete_progress++;
    } catch (error) {
      console.error(`Error fetching kebersihanSite for tower ${towerId}:`, error);
    }

    try {
      const latestKondisiTower = await prisma.kondisiTower.findFirst({
        where: {
          towerId,
          status: "COMPLETED", // Only get completed records
        },
        orderBy: { createdAt: "desc" },
        include: {
          fotos: true, // Include photos
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      latestData.kondisiTower = latestKondisiTower;
      if (latestKondisiTower) complete_progress++;
    } catch (error) {
      console.error(`Error fetching kondisiTower for tower ${towerId}:`, error);
    }

    try {
      const latestPerangkat = await prisma.perangkatAntenna.findFirst({
        where: { towerId },
        orderBy: { createdAt: "desc" },
        include: {
          fotos: true, // Include photos
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      latestData.perangkat = latestPerangkat;
      if (latestPerangkat) complete_progress++;
    } catch (error) {
      console.error(`Error fetching perangkatAntenna for tower ${towerId}:`, error);
    }

    try {
      const latestTegangan = await prisma.teganganListrik.findFirst({
        where: { towerId },
        orderBy: { createdAt: "desc" },
        include: {
          fotos: true, // Include photos
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
      latestData.tegangan = latestTegangan;
      if (latestTegangan) complete_progress++;
    } catch (error) {
      console.error(`Error fetching teganganListrik for tower ${towerId}:`, error);
    }

    // Add convenience mainFotoUrl fields for each latestData item
    for (const key in latestData) {
      if (latestData[key] && latestData[key].fotos && latestData[key].fotos.length > 0) {
        latestData[key].mainFotoUrl = latestData[key].fotos[0].url;
      } else if (latestData[key]) {
        latestData[key].mainFotoUrl = null;
      }
    }

    // Determine status based on complete_progress
    if (complete_progress > 0 && complete_progress < 4) {
      status = "in_progress";
    } else if (complete_progress === 4) {
      status = "completed";
    }

    // Create an array of all latest data objects that exist (not null)
    const allLatestData = Object.values(latestData).filter(item => item !== null);

    if (allLatestData.length > 0) {
      // Sort data by createdAt date for finding last inspection (most recent)
      const sortedByNewest = [...allLatestData].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Sort data by createdAt date for finding first inspection (oldest)
      const sortedByOldest = [...allLatestData].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Get dates and technician name
      lastInspectionDate = sortedByNewest[0].createdAt;
      inspectionDate = sortedByOldest[0].createdAt;
      technicianName = sortedByNewest[0].user?.name || "Unknown";
    }

    res.status(200).json({
      message: "Tower retrieved successfully",
      data: {
        ...tower,
        status,
        complete_progress,
        lastInspectionDate,
        inspectionDate,
        technicianName,
        latestData
      },
    });
  } catch (error) {
    console.error("Error in getTowerById:", error);
    res.status(500).json({ 
      message: "Failed to retrieve tower", 
      error: error.message,
      // For debugging in development, not for production
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getTowerCount = async (req, res) => {
  try {
    const { wilayahId } = req.query;

    const whereClause = {};
    if (wilayahId) {
      whereClause.wilayahId = parseInt(wilayahId);
    }

    const count = await prisma.tower.count({
      where: whereClause,
    });

    res.status(200).json({
      message: "Tower count retrieved successfully",
      data: { count },
    });
  } catch (error) {
    console.error("Error in getTowerCount:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve tower count",
        error: error.message,
      });
  }
};

// Get total antenna counts from all towers across all wilayah
const getAntennaCounts = async (req, res) => {
  try {
    // Get antenna stats from Tower model for all towers
    const antennaStats = await prisma.tower.aggregate({
      _sum: {
        antenaRRU: true,
        antenaRF: true,
        antenaMW: true,
      },
    });

    // Calculate totals
    const totalRRU = antennaStats._sum.antenaRRU || 0;
    const totalRF = antennaStats._sum.antenaRF || 0;
    const totalMW = antennaStats._sum.antenaMW || 0;
    const totalAntena = totalRRU + totalRF + totalMW;

    res.status(200).json({
      message: "Total antenna counts retrieved successfully",
      data: {
        total: totalAntena,
        rru: totalRRU,
        rf: totalRF,
        mw: totalMW,
      },
    });
  } catch (error) {
    console.error("Error in getAntennaCounts:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve antenna counts",
        error: error.message,
      });
  }
};

// Get kebersihan counts (clean vs unclean) for all towers
const getKebersihanCounts = async (req, res) => {
  try {
    // Only count completed records across all towers
    const whereClause = { status: "COMPLETED" };

    // Get kebersihan stats for all towers
    const kebersihanStats = await prisma.kebersihanSite.groupBy({
      by: ["classification"],
      where: whereClause,
      _count: true,
    });

    // Process the kebersihan data
    const cleanCount =
      kebersihanStats.find((stat) => stat.classification === "clean")?._count ||
      0;
    const uncleanCount =
      kebersihanStats.find((stat) => stat.classification === "unclean")
        ?._count || 0;
    const totalKebersihan = cleanCount + uncleanCount;

    res.status(200).json({
      message: "Total kebersihan counts retrieved successfully",
      data: {
        total: totalKebersihan,
        clean: cleanCount,
        unclean: uncleanCount,
      },
    });
  } catch (error) {
    console.error("Error in getKebersihanCounts:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve kebersihan counts",
        error: error.message,
      });
  }
};

// Get tegangan counts (normal, high, low) for all towers
const getTeganganCounts = async (req, res) => {
  try {
    // Only count completed records across all towers
    const whereClause = { status: "COMPLETED" };

    // Get tegangan stats for all towers
    const teganganStats = await prisma.teganganListrik.groupBy({
      by: ["profil"],
      where: whereClause,
      _count: true,
    });

    // Process the tegangan data
    const normalCount =
      teganganStats.find((stat) => stat.profil === "NORMAL")?._count || 0;
    const highCount =
      teganganStats.find((stat) => stat.profil === "HIGH")?._count || 0;
    const lowCount =
      teganganStats.find((stat) => stat.profil === "LOW")?._count || 0;
    const totalTegangan = normalCount + highCount + lowCount;

    res.status(200).json({
      message: "Total tegangan counts retrieved successfully",
      data: {
        total: totalTegangan,
        normal: normalCount,
        high: highCount,
        low: lowCount,
      },
    });
  } catch (error) {
    console.error("Error in getTeganganCounts:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve tegangan counts",
        error: error.message,
      });
  }
};

module.exports = {
  createTower,
  getAllTowers,
  getTowerById,
  getTowerCount,
  getAntennaCounts,
  getKebersihanCounts,
  getTeganganCounts,
};
