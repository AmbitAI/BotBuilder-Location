import * as rp from 'request-promise';
import { sprintf } from 'sprintf-js';
import { RawLocation } from '../rawLocation'

const formAugmentation = "&form=BTCTRL"
const findLocationByQueryUrl = "https://dev.virtualearth.net/REST/v1/Locations?" + formAugmentation;
const findLocationByPointUrl = "https://dev.virtualearth.net/REST/v1/Locations/%1$s,%2$s?" + formAugmentation;
const findImageByPointUrl = "https://dev.virtualearth.net/REST/V1/Imagery/Map/Road/%1$s,%2$s/15?mapSize=500,280&pp=%1$s,%2$s;1;%3$s&dpi=1&logo=always" + formAugmentation;
const findImageByBBoxUrl = "https://dev.virtualearth.net/REST/V1/Imagery/Map/Road?mapArea=%1$s,%2$s,%3$s,%4$s&mapSize=500,280&pp=%5$s,%6$s;1;%7$s&dpi=1&logo=always" + formAugmentation;

export function getLocationByQuery(apiKey: any, address: string): Promise<Array<RawLocation>> {
    const requestData = {
        url: `https://api.nzpost.co.nz/privateaddresschecker/1.0/find?address_line_1=${encodeURIComponent(address)}&type=Postal&client_id=${apiKey.client_id}&client_secret=${apiKey.client_secret}`,
        headers: {
            'Accept': 'application/json'
        },
        json: true
    };

    return new Promise((resolve, reject) => {
        rp(requestData)
            .then(body => {
                if (body && body.addresses) {
                    let bingLocations: Array<RawLocation> = [];
                    let solved = 0;
                    var url = addKeyToUrl(findLocationByQueryUrl, apiKey.bingApiKey) + "&q=" + encodeURIComponent(body.addresses[0].FullAddress);
                    getLocation(url)
                        .then(locations => {
                            solved += 1;
                            if (locations.length > 0) {
                                bingLocations.push(locations[0]);
                            }
                            if (solved === 3) {
                                resolve(bingLocations);
                            }
                        });url = addKeyToUrl(findLocationByQueryUrl, apiKey.bingApiKey) + "&q=" + encodeURIComponent(body.addresses[1].FullAddress);
                    getLocation(url)
                        .then(locations => {
                            solved += 1;
                            if (locations.length > 0) {
                                bingLocations.push(locations[0]);
                            }
                            if (solved === 3) {
                                resolve(bingLocations);
                            }
                        });url = addKeyToUrl(findLocationByQueryUrl, apiKey.bingApiKey) + "&q=" + encodeURIComponent(body.addresses[2].FullAddress);
                    getLocation(url)
                        .then(locations => {
                            solved += 1;
                            if (locations.length > 0) {
                                bingLocations.push(locations[0]);
                            }
                            if (solved === 3) {
                                resolve(bingLocations);
                            }
                        });
                } else {
                    throw ("Invalid Api Response");
                }
            });
    });
}

export function getLocationByPoint(apiKey: string, latitude: string, longitude: string): Promise<Array<RawLocation>> {
    var url: string = sprintf(findLocationByPointUrl, latitude, longitude);
    url = addKeyToUrl(url, apiKey) + "&q=";
    return getLocation(url);
}

export function GetLocationMapImageUrl(apiKey: string, location: RawLocation, index?: number) {
    if (location && location.point && location.point.coordinates && location.point.coordinates.length == 2) {

        var point = location.point;
        var url: string;
        var sIndex = typeof index === "undefined" ? "" : index.toString();

        if (location.bbox && location.bbox.length == 4) {
            url = sprintf(findImageByBBoxUrl, location.bbox[0], location.bbox[1], location.bbox[2], location.bbox[3], point.coordinates[0], point.coordinates[1], sIndex)
        }
        else {
            url = sprintf(findImageByPointUrl, point.coordinates[0], point.coordinates[1], sIndex)
        }            
        
        url = addKeyToUrl(url, apiKey);

        return url;
    }

    throw "Invalid Location Format: " + location;
}

function getLocation(url: string): Promise<Array<RawLocation>> {
    const requestData = {
        url: url,
        json: true
    };

    return rp(requestData)
        .then(body => {
            if (body && body.resourceSets && body.resourceSets[0] && body.resourceSets[0].resources) {
                return body.resourceSets[0].resources;
            } else {
                throw ("Invalid Api Response");
            }
        });
}

function addKeyToUrl(url: string, apiKey: string): string {
    return url + "&key=" + apiKey;
}