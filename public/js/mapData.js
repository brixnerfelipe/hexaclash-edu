// Map Data
const REGIONS = [
    {
        "name": "Zeta",
        "count": 4,
        "bonus": 2,
        "color": "#d1f2eb"
    },
    {
        "name": "Delta",
        "count": 5,
        "bonus": 2,
        "color": "#fdebd0"
    },
    {
        "name": "Alpha",
        "count": 6,
        "bonus": 3,
        "color": "#d4e6f1"
    },
    {
        "name": "Beta",
        "count": 7,
        "bonus": 5,
        "color": "#fadbd8"
    },
    {
        "name": "Epsilon",
        "count": 9,
        "bonus": 5,
        "color": "#ebdef0"
    },
    {
        "name": "Gamma",
        "count": 11,
        "bonus": 7,
        "color": "#fcf3cf"
    }
];

const TERRITORIES = [
    {
        "id": 1,
        "name": "Terr 1",
        "region": "Zeta",
        "owner": null,
        "armies": 0,
        "col": 0,
        "row": 0,
        "x": 0,
        "y": 0,
        "neighbors": [
            2
        ]
    },
    {
        "id": 2,
        "name": "Terr 2",
        "region": "Zeta",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 0,
        "x": 77.94228634059948,
        "y": 0,
        "neighbors": [
            1,
            7
        ]
    },
    {
        "id": 3,
        "name": "Terr 3",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 0,
        "x": 311.7691453623979,
        "y": 0,
        "neighbors": [
            4,
            9
        ]
    },
    {
        "id": 4,
        "name": "Terr 4",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 5,
        "row": 0,
        "x": 389.7114317029974,
        "y": 0,
        "neighbors": [
            3,
            5,
            9,
            10
        ]
    },
    {
        "id": 5,
        "name": "Terr 5",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 0,
        "x": 467.6537180435969,
        "y": 0,
        "neighbors": [
            4,
            6,
            10,
            11
        ]
    },
    {
        "id": 6,
        "name": "Terr 6",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 0,
        "x": 545.5960043841964,
        "y": 0,
        "neighbors": [
            5,
            11,
            12
        ]
    },
    {
        "id": 7,
        "name": "Terr 7",
        "region": "Zeta",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 1,
        "x": 116.91342951089922,
        "y": 67.5,
        "neighbors": [
            2,
            8,
            13
        ]
    },
    {
        "id": 8,
        "name": "Terr 8",
        "region": "Zeta",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 1,
        "x": 194.8557158514987,
        "y": 67.5,
        "neighbors": [
            7,
            13,
            14
        ]
    },
    {
        "id": 9,
        "name": "Terr 9",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 1,
        "x": 350.74028853269766,
        "y": 67.5,
        "neighbors": [
            3,
            4,
            10,
            15
        ]
    },
    {
        "id": 10,
        "name": "Terr 10",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 5,
        "row": 1,
        "x": 428.68257487329714,
        "y": 67.5,
        "neighbors": [
            4,
            5,
            9,
            11,
            16
        ]
    },
    {
        "id": 11,
        "name": "Terr 11",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 1,
        "x": 506.6248612138966,
        "y": 67.5,
        "neighbors": [
            5,
            6,
            10,
            12,
            16
        ]
    },
    {
        "id": 12,
        "name": "Terr 12",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 1,
        "x": 584.5671475544962,
        "y": 67.5,
        "neighbors": [
            6,
            11
        ]
    },
    {
        "id": 13,
        "name": "Terr 13",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 2,
        "x": 155.88457268119896,
        "y": 135,
        "neighbors": [
            7,
            8,
            14,
            17,
            18
        ]
    },
    {
        "id": 14,
        "name": "Terr 14",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 3,
        "row": 2,
        "x": 233.82685902179844,
        "y": 135,
        "neighbors": [
            8,
            13,
            15,
            18,
            19
        ]
    },
    {
        "id": 15,
        "name": "Terr 15",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 2,
        "x": 311.7691453623979,
        "y": 135,
        "neighbors": [
            9,
            14,
            19
        ]
    },
    {
        "id": 16,
        "name": "Terr 16",
        "region": "Epsilon",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 2,
        "x": 467.6537180435969,
        "y": 135,
        "neighbors": [
            10,
            11
        ]
    },
    {
        "id": 17,
        "name": "Terr 17",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 3,
        "x": 116.91342951089922,
        "y": 202.5,
        "neighbors": [
            13,
            18
        ]
    },
    {
        "id": 18,
        "name": "Terr 18",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 3,
        "x": 194.8557158514987,
        "y": 202.5,
        "neighbors": [
            13,
            14,
            17,
            19,
            20
        ]
    },
    {
        "id": 19,
        "name": "Terr 19",
        "region": "Alpha",
        "owner": null,
        "armies": 0,
        "col": 3,
        "row": 3,
        "x": 272.7980021920982,
        "y": 202.5,
        "neighbors": [
            14,
            15,
            18,
            20,
            21
        ]
    },
    {
        "id": 20,
        "name": "Terr 20",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 3,
        "row": 4,
        "x": 233.82685902179844,
        "y": 270,
        "neighbors": [
            18,
            19,
            21,
            26
        ]
    },
    {
        "id": 21,
        "name": "Terr 21",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 4,
        "x": 311.7691453623979,
        "y": 270,
        "neighbors": [
            19,
            20,
            22,
            27
        ]
    },
    {
        "id": 22,
        "name": "Terr 22",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 5,
        "row": 4,
        "x": 389.7114317029974,
        "y": 270,
        "neighbors": [
            21,
            23,
            27,
            28
        ]
    },
    {
        "id": 23,
        "name": "Terr 23",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 4,
        "x": 467.6537180435969,
        "y": 270,
        "neighbors": [
            22,
            24,
            28,
            29
        ]
    },
    {
        "id": 24,
        "name": "Terr 24",
        "region": "Delta",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 4,
        "x": 545.5960043841964,
        "y": 270,
        "neighbors": [
            23,
            29,
            30
        ]
    },
    {
        "id": 25,
        "name": "Terr 25",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 5,
        "x": 116.91342951089922,
        "y": 337.5,
        "neighbors": [
            26,
            32,
            33
        ]
    },
    {
        "id": 26,
        "name": "Terr 26",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 5,
        "x": 194.8557158514987,
        "y": 337.5,
        "neighbors": [
            20,
            25,
            33
        ]
    },
    {
        "id": 27,
        "name": "Terr 27",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 5,
        "x": 350.74028853269766,
        "y": 337.5,
        "neighbors": [
            21,
            22,
            28,
            34,
            35
        ]
    },
    {
        "id": 28,
        "name": "Terr 28",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 5,
        "row": 5,
        "x": 428.68257487329714,
        "y": 337.5,
        "neighbors": [
            22,
            23,
            27,
            29,
            35,
            36
        ]
    },
    {
        "id": 29,
        "name": "Terr 29",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 5,
        "x": 506.6248612138966,
        "y": 337.5,
        "neighbors": [
            23,
            24,
            28,
            30,
            36,
            37
        ]
    },
    {
        "id": 30,
        "name": "Terr 30",
        "region": "Delta",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 5,
        "x": 584.5671475544962,
        "y": 337.5,
        "neighbors": [
            24,
            29,
            37
        ]
    },
    {
        "id": 31,
        "name": "Terr 31",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 0,
        "row": 6,
        "x": 0,
        "y": 405,
        "neighbors": [
            32
        ]
    },
    {
        "id": 32,
        "name": "Terr 32",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 6,
        "x": 77.94228634059948,
        "y": 405,
        "neighbors": [
            25,
            31,
            33,
            38
        ]
    },
    {
        "id": 33,
        "name": "Terr 33",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 6,
        "x": 155.88457268119896,
        "y": 405,
        "neighbors": [
            25,
            26,
            32,
            38,
            39
        ]
    },
    {
        "id": 34,
        "name": "Terr 34",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 6,
        "x": 311.7691453623979,
        "y": 405,
        "neighbors": [
            27,
            35,
            40
        ]
    },
    {
        "id": 35,
        "name": "Terr 35",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 5,
        "row": 6,
        "x": 389.7114317029974,
        "y": 405,
        "neighbors": [
            27,
            28,
            34,
            36,
            40
        ]
    },
    {
        "id": 36,
        "name": "Terr 36",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 6,
        "x": 467.6537180435969,
        "y": 405,
        "neighbors": [
            28,
            29,
            35,
            37
        ]
    },
    {
        "id": 37,
        "name": "Terr 37",
        "region": "Delta",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 6,
        "x": 545.5960043841964,
        "y": 405,
        "neighbors": [
            29,
            30,
            36,
            41
        ]
    },
    {
        "id": 38,
        "name": "Terr 38",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 1,
        "row": 7,
        "x": 116.91342951089922,
        "y": 472.5,
        "neighbors": [
            32,
            33,
            39
        ]
    },
    {
        "id": 39,
        "name": "Terr 39",
        "region": "Beta",
        "owner": null,
        "armies": 0,
        "col": 2,
        "row": 7,
        "x": 194.8557158514987,
        "y": 472.5,
        "neighbors": [
            33,
            38
        ]
    },
    {
        "id": 40,
        "name": "Terr 40",
        "region": "Gamma",
        "owner": null,
        "armies": 0,
        "col": 4,
        "row": 7,
        "x": 350.74028853269766,
        "y": 472.5,
        "neighbors": [
            34,
            35,
            42
        ]
    },
    {
        "id": 41,
        "name": "Terr 41",
        "region": "Delta",
        "owner": null,
        "armies": 0,
        "col": 7,
        "row": 7,
        "x": 584.5671475544962,
        "y": 472.5,
        "neighbors": [
            37,
            42
        ]
    },
    {
        "id": 42,
        "name": "Terr 42",
        "region": "Delta",
        "owner": null,
        "armies": 0,
        "col": 6,
        "row": 8,
        "x": 467.6537180435969,
        "y": 540,
        "neighbors": [
            40,
            41
        ]
    }
];
