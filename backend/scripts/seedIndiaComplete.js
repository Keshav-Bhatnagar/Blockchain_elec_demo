import mongoose from 'mongoose';
import Boundary from '../models/Boundary.js';

const GEOJSON_URL = 'https://raw.githubusercontent.com/datameet/maps/master/parliamentary-constituencies/india_pc_2019_simplified.geojson';

const seedPanIndiaElectoralNetwork = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indian-e-voting');
    console.log("📡 Connected to Core Database Node Cluster...");

    await Boundary.deleteMany({});
    console.log("🧹 Successfully flushed and wiped older offline caches.");

    console.log("⚙️ Fetching Real 2019 Pan-India Constituency Geography...");
    const res = await fetch(GEOJSON_URL);
    const geoData = await res.json();
    
    let trackingWardId = 10001;
    let totalPCSeeded = 0;
    let totalWardsSeeded = 0;

    for (const feature of geoData.features) {
      const props = feature.properties;
      const pcName = props.pc_name;
      const stName = props.st_name;
      // Use pc_id as the primary blockchain geoId. If it's a string, hash it or just use an incrementor.
      // Wait, pc_id is like 201, 101, etc. Sometimes it might not be continuous or might clash.
      // Let's just use totalPCSeeded + 1 to ensure standard 1..543 contiguous IDs for the blockchain!
      const currentPCId = totalPCSeeded + 1;
      
      await Boundary.create({
        geoId: currentPCId,
        name: pcName,
        type: 'National',
        electionSubtype: 'LokSabha',
        state: stName,
        meta: { state: stName, original_pc_id: props.pc_id },
        active: true
      });
      totalPCSeeded++;

      // Create 2 mock municipal wards for each constituency so the ward system still works
      for (let w = 1; w <= 2; w++) {
        await Boundary.create({
          geoId: trackingWardId++,
          name: `${pcName} Municipal Ward ${w}`,
          type: 'Local',
          electionSubtype: 'Municipal',
          state: stName,
          parentConstituencyId: currentPCId,
          active: true
        });
        totalWardsSeeded++;
      }
    }

    console.log("\n📈 ──────────────────────────────────────────────────");
    console.log("🚀 PAN-INDIA HARD CORE GEOGRAPHY OVERHAUL SUCCESSFUL!");
    console.log(`📍 Total REAL Parliamentary Constituencies Minted: ${totalPCSeeded}`);
    console.log(`🏢 Total Local Body Governance Wards Minted: ${totalWardsSeeded}`);
    console.log("─────────────────────────────────────────────────────");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Seeding Execution Drop:", err);
    process.exit(1);
  }
};

seedPanIndiaElectoralNetwork();
