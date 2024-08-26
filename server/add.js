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
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'JMC Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.jmchomes.com/homes");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".HomeCard_inner").map(async (index, element) => {
            const status = $(element).find(".HomeCard_media .HomeCard_statusWrapper .HomeCard_status").text();

            if (status === "move-in ready") {
                const city = $(element).find(".HomeCard_city").text();
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
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Beazer Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));
        const currentAddresses = new Set();
    
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: {
                width: 1280,
                height: 800
            }
        });
        const page = await browser.newPage();
    
        await page.goto("https://www.beazer.com/search-ca-sacramento");
        await page.waitForSelector('a'); // Wait for any anchor tag to be available
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const quickMoveInsLink = links.find(link => link.textContent.includes('Quick Move-ins'));
            if (quickMoveInsLink) {
                quickMoveInsLink.click();
            }
        });
    
        await page.waitForSelector('div.product-card.card_spec_outer.horizontal');
    
        // Step 1: Select all product-cards
        const houseCards = await page.$$('div.product-card.card_spec_outer.horizontal');
    
        // Step 2: Iterate through each product card
        for (const house of houseCards) {
            // Step 3: Find the bold element with classes 'bold block uppercase'
            const statusText = await house.$('b.bold.block.uppercase');
       
            // Extract the text content
            const status = await page.evaluate(element => element.textContent, statusText);
                
            if (status === "Now") {
                const link = await house.$eval('a.red-button.margin-medium', anchor => {
                    return anchor.href;
                });
                const segments = link.split("/");
                const address = segments[6].replace(/-/g, " ");
                currentAddresses.add(address);

                if (!existingAddresses.has(address)) {
                    const city = (await house.$eval('.seriesname', locationText => locationText.textContent)).split("|")[1].trim();
                    const community = (await house.$eval('.seriesname', locationText => locationText.textContent)).split("|")[0].trim();
                    const price = (await house.$eval('.font18.no-margin.right-align', priceText => priceText.textContent)).replace(/[^0-9]/g, "").trim();
                }
            }
        }
        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addWoodside:", err);
    }  
}

// gonna need to use pupeteer dynamic web page
async function addCentury() {
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Woodside Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.centurycommunities.com/find-your-new-home/california/northern-california-metro/");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".century-card").map(async (index, element) => {
            const address = $(element).find(".panel-home__content-description").text().trim();
            currentAddresses.add(address);

            if (!existingAddresses.has(address)) {

                await db.query(`
                    INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    ["Century Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
                );
            }
        }).get();
        
        await Promise.all(homePromises);
        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addCentury:", err);
    }
    console.log("Finished adding Century Homes");
}

// gonna need to use pupeteer dynamic web page
async function addMeritage() {
    try {
        const existingAddressResult = await db.query("SELECT address FROM homes WHERE builder = 'Meritage Homes'");
        const existingAddresses = new Set(existingAddressResult.rows.map(row => row.address));

        const response = await axios.get("https://www.meritagehomes.com/state/ca/sacramento/search/qmi/1");
        const $ = cheerio.load(response.data);

        const currentAddresses = new Set();

        const homePromises = $(".community-horizontal").map(async (index, element) => {
            const locationInfo = $(element).find(".mid p.community--range-mo").text();
            console.log(locationInfo);
            // const address = $(element).find(".community--range-mo").text().trim();
            // currentAddresses.add(address);

            // if (!existingAddresses.has(address)) {

            //     await db.query(`
            //         INSERT INTO homes (builder, address, city, community, price, sqft, beds, baths, garages, imgurl)
            //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            //         ["Meritage Homes", address, city, community, price, sqFt, beds, baths, garages, imgUrl]
            //     );
            // }
        }).get();
        
        await Promise.all(homePromises);
        const addressesToDelete = Array.from(existingAddresses).filter(address => !currentAddresses.has(address));

        if (addressesToDelete.length > 0) {
            await db.query("DELETE FROM homes WHERE address = ANY($1)", [addressesToDelete]);
        }
    } catch (err) {
        console.log("Error in addMeritage:", err);
    }
    console.log("Finished adding Meritage Homes");    
}

addBeazer();

export { addJmc, addWoodside }