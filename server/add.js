import axios from "axios";
import * as cheerio from "cheerio";
import env from "dotenv";
import pg from "pg";
import puppeteer from "puppeteer";

env.config();

const db = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "NorCalNewBuilds",
    password: "9kxtEC%M5%^2N92B",
    port: 5432
});

async function addJmc() {
    console.log("Adding JMC");
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'JMC Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.jmchomes.com/homes");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".HomeCard_inner").map(async (index, element) => {
            const status = $(element).find(".HomeCard_media .HomeCard_statusWrapper .HomeCard_status").text();

            if (status === "move-in ready") {
                const city = $(element).find(".HomeCard_city").text().split(",")[0].trim();
                const address = $(element).find(".HomeCard_address a").text().replace(city, "").trim();
                currentAddresses.add(address);

                if (!existingAddresses.has(address)) {
                    // Reinitialize houseDetails for each home
                    let houseDetails = [];

                    $(element).find(".HomeCard_specItem").each((i, el) => {
                        const detail = $(el).find(".HomeCard_specValue").text();
                        houseDetails.push(detail);
                    });

                    const community = $(element).find(".HomeCard_communityLink").text();
                    const price = $(element).find(".HomeCard_price").text().replace(/[^0-9]/g, "");
                    const sqFt = houseDetails[0]?.replace(/[^0-9]/g, "") || "";
                    const beds = houseDetails[1]?.replace(/[^0-9]/g, "") || "";
                    const baths = houseDetails[2]?.replace(/[^0-9.]/g, "") || "";
                    const garages = houseDetails[3]?.replace(/[^0-9]/g, "") || "";
                    const imgUrl = $(element).find(".HomeCard_media img").attr("src");

                    await db.query(
                        `INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        ["JMC Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                    );
                }
            }
        }).get(); // Convert to array

        await Promise.all(homePromises);
        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.error("Error in addJmc:", err);
    }
}

async function addWoodside() {
    console.log("Adding Woodside");
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Woodside Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.woodsidehomes.com/findmyhome/northern-california/moveinreadycollection");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".panel-home").map(async (index, element) =>{
            const address = $(element).find(".panel-home__content-description").text().trim();
            currentAddresses.add(address);

            if (!existingAddresses.has(address)) {
                const city = $(element).find(".panel-home__community-name").text().split(" | ")[0].trim();
                const community = $(element).find(".panel-home__community-name").text().split(" | ")[1].trim();
                const price = $(element).find(".panel-home__content-price").text().split("at")[1].trim().replace(/[^0-9]/g, "");
                const sqFt = $(element).find(".panel-home__content-area-and-features").text().split("Sq")[0].trim().replace(/[^0-9]/g, "");
                const beds = $(element).find(".panel-home__content-meta-part-1").text().split("Beds")[0].trim().replace(/[^0-9]/g, "");
                const baths = $(element).find(".panel-home__content-meta-part-1").text().split(" · ")[1].trim().replace(/[^0-9.]/g, "");
                const garages = $(element).find(".panel-home__content-meta-part-2").text().split("Car")[0].trim().replace(/[^0-9]/g, "");
                const imgUrl = $(element).find("img").attr("data-url");

                await db.query(`
                    INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    ["Woodside Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                );
            }
        }).get();
        
        await Promise.all(homePromises);
        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addWoodside:", err);
    }
}

async function addBeazer() {
    console.log("Adding Beazer");
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Beazer Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.beazer.com/search-ca-sacramento");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".product-card.card_spec_outer").map(async (index, element) => {
            // const status = $(element).find(".stats .bold.block.uppercase").text().trim();
            const address = $(element).find("a").attr("href").split("/")[4].replace(/-/g, " ");
            currentAddresses.add(address);

            if (!existingAddresses.has(address)) {
                const city = $(element).find(".seriesname").text().split("|")[1].split(",")[0].trim();
                const community = $(element).find(".seriesname").text().split(" | ")[0].trim();
                const price = $(element).find(".info .font18.no-margin.right-align").text().trim().replace(/[^0-9]/g, "");
                const sqFt = $(element).find(".stats ul li").eq(5).text().trim().replace(/[^0-9]/g, "");
                const beds = $(element).find(".stats ul li").eq(3).text().trim().replace(/[^0-9]/g, "");
                const baths = $(element).find(".stats ul li").eq(4).text().trim().replace(/[^0-9.]/g, "");
                const garages = -1;
                const imgUrl = $(element).find("img").attr("src");

                await db.query(`
                    INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    ["Beazer Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                );
            }
        }).get();
        await Promise.all(homePromises);

        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));
        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addBeazer:", err);
    }
}

async function addKb() {
    console.log("Adding Kb");
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Kb Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });

        const page = await browser.newPage();
        await page.goto("https://www.kbhome.com/move-in-ready?state=california&region=sacramento");

        const currentAddresses = new Set();
    
        await page.waitForSelector(".community-filters .input-select.room-filter");
        await page.select(".community-filters .input-select.room-filter", "Available Now");

        let card_number = 12;

        while (card_number === 12) {
            await page.waitForSelector(".mir-card");
            const mirCards = await page.$$(".mir-card");
            card_number = mirCards.length;
    
            for (const mirCard of mirCards) {
                const address = await mirCard.$eval("h2", h2 => h2.textContent.trim());
                currentAddresses.add(address);
    
                if (!existingAddresses.has(address)) {
                    const houseDetails = await mirCard.$$eval(".font-AvenirNextLTPro-Bold", details => {
                        return details.map(detail => detail.textContent);
                    });
            
                    const city = await mirCard.$eval("p", p => p.textContent.split("\n")[2].split(",")[0].trim());
                    const community = await mirCard.$eval("p", p => p.textContent.split("\n")[1].split(",")[0].trim());
                    const price = await mirCard.$eval(".price", price => price.textContent.replace(/[^0-9]/g, "").trim());
                    const sqFt = houseDetails[3].replace(/[^0-9]/g, "");
                    const beds = houseDetails[0];
                    const baths = houseDetails[1];
                    const garages = houseDetails[2];
                    const imgUrl = await mirCard.$eval("img", a => a.src.trim());
            
                    await db.query(`
                        INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        ["Kb Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                    );
                }
            } 

            await page.click(".next"); 
        }

        browser.close();

        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addKb:", err);
    } 
}

async function addTripointe() {
    console.log("Adding Tripointe");
    try { 
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Tripointe Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });

        const page = await browser.newPage();
        await page.goto("https://www.tripointehomes.com/find-your-home/ca/sacramento/?type=neighborhoods&refinementList%5Bavailability_status%5D=Move-In%20Ready&refinementList%5Bmove_in_window%5D=1%E2%80%933%20mo.&sortBy=production_homes&refinementList%5Bavailability_status%5D=Move-In%20Ready&refinementList%5Bmove_in_window%5D=1%E2%80%933%20mo.");

        const currentAddresses = new Set();

        await page.waitForSelector('[aria-label="Change search tab to Homes & Floorplans"]');
        await page.click('[aria-label="Change search tab to Homes & Floorplans"]');

        try {
            while (true) {
                let loadButton = await page.waitForSelector("a.btn-solid.btn-solid--apple", { timeout: 1000});
                const link = await page.$eval("a.btn-solid.btn-solid--apple", a => a.href);
                await page.goto(link);
                await page.waitForSelector('[aria-label="Change search tab to Homes & Floorplans"]');
                await page.click('[aria-label="Change search tab to Homes & Floorplans"]');
            }
        } catch (err) {
            console.log("Loaded all houses for Tripointe Homes")
        }

        await page.waitForSelector(".tw-uppercase.tw-text-slate.tw-text-xxxs.tw-font-medium.tw-tracking-wide.tw-mb-2");
        const cards = await page.$$(".tw-animate-fade-in.tw-relative.tw-pb-12.tw-h-full.tw-group");

        for (const card of cards) {
            const address = await card.$eval("div div div div h4 a", a => a.textContent.trim());
            currentAddresses.add(address);

            if (!existingAddresses.has(address)) {
                const houseDetails = await card.$$eval("span.pb-1.tw-text-sm.tw-text-ash.tw-text-center.tw-font-medium", details => {
                    return details.map(detail => detail.textContent.trim());
                });

                const city = await card.$eval("span.tw-font-medium.tw-text-sm.tw-text-charcoal.tw-pr-2", span => span.textContent.trim().split(",")[0]);
                const community = await card.$eval("div div div div h4 a", a => a.href.split("/")[5].replace(/[-]/g, " ").trim());
                const price = await card.$eval("span.tw-font-medium.tw-text-sm.tw-text-charcoal.tw-pl-2", span => span.textContent.replace(/[^0-9]/g, "").trim());
                const sqFt = houseDetails[0].replace(/[^0-9]/g, "");
                const beds = houseDetails[1];
                const baths = houseDetails[2];
                const garages = houseDetails[3];
                const imgUrl = await card.$eval("img", img => img.src.trim());

                try {
                    await db.query(`
                        INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        ["Tripointe Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                    );
                } catch {
                    break;
                }
            }
        }

        browser.close();

        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addTripointe", err);
    }
}
 
function addHomes() {
    addJmc();
    addWoodside();
    addBeazer();
    addKb();
    addTripointe();
}

addHomes();

export default addHomes;