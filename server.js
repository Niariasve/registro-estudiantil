import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultColors = [
  '#2e7d32', '#00695c', '#0277bd', '#283593', '#6a1b9a', '#ad1457', '#d84315', '#4e342e', '#37474f'
];

const defaultData = {
  "selectedClassId": "class-paralelo-b",
  "classes": [
    {
      "id": "class-paralelo-b",
      "name": "Computación - Paralelo B",
      "code": "PARALELO B",
      "term": "I PAO 2026",
      "color": "#0284c7",
      "activities": [
        {
          "id": "act-pretest",
          "name": "Test Inicial (Pre-Test)",
          "maxScore": 10
        },
        {
          "id": "act-posttest",
          "name": "Test Final (Post-Test)",
          "maxScore": 10
        },
        {
          "id": "act-taller-1",
          "name": "Taller 1: Algoritmos",
          "maxScore": 10
        },
        {
          "id": "act-taller-2",
          "name": "Taller 2: Patrones y Bucles",
          "maxScore": 10
        }
      ]
    }
  ],
  "students": [
    {
      "id": "student-pb-01",
      "num": 1,
      "name": "BAJAÑA BAJAÑA KRISTEL ALEXA",
      "cedula": "960653525",
      "email": "babakral11688368@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-02",
      "num": 2,
      "name": "BAJAÑA PLUAS HELEN PATRICIA",
      "cedula": "960227767",
      "email": "baplhepa10645680@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-03",
      "num": 3,
      "name": "BALON FAJARDO SCARLETT VALENTINA",
      "cedula": "961132503",
      "email": "bafascva12463217@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-04",
      "num": 4,
      "name": "BRIONES JOCONA AUSTIN JUNIOR",
      "cedula": "960551612",
      "email": "brjoauju10700303@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-05",
      "num": 5,
      "name": "BRIONES SEGURA DYLAN SNEIDER",
      "cedula": "960277184",
      "email": "brsedysn10694905@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-06",
      "num": 6,
      "name": "CABRERA BRIONES BRIANNA ASLEY",
      "cedula": "960447167",
      "email": "cabrbras10709205@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-07",
      "num": 7,
      "name": "CALDERON ALVARADO ANGEL MAURICIO",
      "cedula": "960916328",
      "email": "caalanma11629807@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-08",
      "num": 8,
      "name": "CASTRO BAJAÑA IKER ALEJANDRO",
      "cedula": "960568954",
      "email": "cabaikal10708176@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-09",
      "num": 9,
      "name": "CASTRO SALMON DEREK",
      "cedula": "960729499",
      "email": "casade13172680@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-10",
      "num": 10,
      "name": "CEDEÑO DESIDERIO JOSHUA DIDIER",
      "cedula": "960849057",
      "email": "cedejodi11810360@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-11",
      "num": 11,
      "name": "CHIRIGUAYA TORRES MAYTE YENEXY",
      "cedula": "961093275",
      "email": "chtomaye10746077@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-12",
      "num": 12,
      "name": "DESIDERIO RUIZ MANUEL ALEJANDRO",
      "cedula": "960513323",
      "email": "derumaal10726803@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-13",
      "num": 13,
      "name": "ESPINOZA JIMENEZ ELIANA ANAISHA",
      "cedula": "960967339",
      "email": "esjielan11799465@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-14",
      "num": 14,
      "name": "FLORES BURGOS HEIDY SAMARA",
      "cedula": "960910834",
      "email": "flbuhesa12286920@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-15",
      "num": 15,
      "name": "GUERRERO JIMENEZ KAROL JULIETTE",
      "cedula": "961013372",
      "email": "gujikaju11633572@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-16",
      "num": 16,
      "name": "MORA SANTOS JOSHUA ALEJANDRO",
      "cedula": "960736700",
      "email": "mosajoal11630945@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-17",
      "num": 17,
      "name": "MOTA AGUIRRE BRIANNA AITANA",
      "cedula": "960938421",
      "email": "moagbrai13179179@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-18",
      "num": 18,
      "name": "OLMEDO FAJARDO SNAYDER MIGUEL",
      "cedula": "960152908",
      "email": "olfasnmi10872845@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-19",
      "num": 19,
      "name": "OLVERA ZAMBRANO JESUS DANIEL",
      "cedula": "960135929",
      "email": "olzajeda11939071@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-20",
      "num": 20,
      "name": "OROZCO MONTOYA ELENA YULIETTE",
      "cedula": "960371813",
      "email": "ormoelyu10756027@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-21",
      "num": 21,
      "name": "OROZCO SILVA JAYNER ADRIANO",
      "cedula": "960696128",
      "email": "orsijaad11630346@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-22",
      "num": 22,
      "name": "ORTEGA BRIONES TAYRON JEAMPOL",
      "cedula": "960852143",
      "email": "orbrtaje11638222@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-23",
      "num": 23,
      "name": "PARRAGA CALDERON CARLOS FABIAN",
      "cedula": "960186179",
      "email": "pacacafa10668459@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-24",
      "num": 24,
      "name": "PARREÑO MENCIAS ABRAHAM EZEQUIEL",
      "cedula": "960284248",
      "email": "pameabez11558977@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-25",
      "num": 25,
      "name": "PIZA VALERIA",
      "cedula": "",
      "email": ""
    },
    {
      "id": "student-pb-26",
      "num": 26,
      "name": "QUIJIJE JIMENEZ AIDAN VICENTE",
      "cedula": "960312080",
      "email": "qujiaivi10763670@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-27",
      "num": 27,
      "name": "QUINTANA PLUAS MATEO GABRIEL",
      "cedula": "960455509",
      "email": "quplmaga11565363@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-28",
      "num": 28,
      "name": "REYES ANCHUNDIA AITANNA ELIZABETH",
      "cedula": "960591154",
      "email": "reanaiel11018172@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-29",
      "num": 29,
      "name": "RODRIGUEZ POSLIGUA EVELIN KATHERINE",
      "cedula": "960311231",
      "email": "ropoevka11145672@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-30",
      "num": 30,
      "name": "RODRIGUEZ RUGEL AINARA BELEN",
      "cedula": "",
      "email": ""
    },
    {
      "id": "student-pb-31",
      "num": 31,
      "name": "RODRIGUEZ RUGEL DEBANHY YARENI",
      "cedula": "960289213",
      "email": "rorudeya10713182@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-32",
      "num": 32,
      "name": "RUGEL CALDERON IKER EMANUEL",
      "cedula": "960558112",
      "email": "rucaikem11826993@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-33",
      "num": 33,
      "name": "RUGEL HERNANDEZ JUAN ALEXANDER",
      "cedula": "960564540",
      "email": "ruhejual12339593@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-34",
      "num": 34,
      "name": "RUGEL VILLEGAS TIFFANY ZULEYKA",
      "cedula": "960972453",
      "email": "ruvitizu11630228@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-35",
      "num": 35,
      "name": "SALAZAR ALMEIDA AXEL MATHIAS",
      "cedula": "961045457",
      "email": "saalaxma11637921@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-36",
      "num": 36,
      "name": "SEGURA CARPIO BLANCA LEILANY",
      "cedula": "960721132",
      "email": "secablle11630551@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-37",
      "num": 37,
      "name": "SEGURA SANCHEZ SNEYDER SAMIR",
      "cedula": "960391324",
      "email": "sesasnsa10697767@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-38",
      "num": 38,
      "name": "TORRES PALMA MILLER NATHANAEL",
      "cedula": "960538924",
      "email": "topamina10858966@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-39",
      "num": 39,
      "name": "VALDEZ GANCHOZO DAKEYSHA DYVANNA",
      "cedula": "E003572979",
      "email": "vagadady12435691@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-40",
      "num": 40,
      "name": "VILLAMAR TORRES JOEL MAXIMILIANO",
      "cedula": "932788995",
      "email": "vitojoma10654974@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-41",
      "num": 41,
      "name": "ZAMBRANO ALCIVAR SNAYDER JAIR",
      "cedula": "960801181",
      "email": "zaalsnja12429380@estudiantes3.edu.ec"
    },
    {
      "id": "student-pb-42",
      "num": 42,
      "name": "ZAMBRANO VILLAMAR ABNER STEVEN",
      "cedula": "960672616",
      "email": "zaviabst11795184@estudiantes3.edu.ec"
    }
  ],
  "grades": {
    "student-pb-01:act-pretest": 3.64,
    "student-pb-01:act-posttest": 4.55,
    "student-pb-02:act-pretest": 7.27,
    "student-pb-02:act-posttest": 4.55,
    "student-pb-03:act-pretest": 7.27,
    "student-pb-04:act-pretest": 5.45,
    "student-pb-05:act-pretest": 9.09,
    "student-pb-05:act-posttest": 7.27,
    "student-pb-06:act-pretest": 7.27,
    "student-pb-06:act-posttest": 6.36,
    "student-pb-07:act-pretest": 3.64,
    "student-pb-07:act-posttest": 3.64,
    "student-pb-08:act-pretest": 6.36,
    "student-pb-08:act-posttest": 8.18,
    "student-pb-09:act-pretest": 6.36,
    "student-pb-09:act-posttest": 5.45,
    "student-pb-10:act-pretest": 7.27,
    "student-pb-10:act-posttest": 5.45,
    "student-pb-11:act-pretest": 7.27,
    "student-pb-11:act-posttest": 5.45,
    "student-pb-12:act-pretest": 3.64,
    "student-pb-12:act-posttest": 3.64,
    "student-pb-13:act-pretest": 5.45,
    "student-pb-13:act-posttest": 7.27,
    "student-pb-14:act-pretest": 5.45,
    "student-pb-14:act-posttest": 3.64,
    "student-pb-15:act-pretest": 8.18,
    "student-pb-15:act-posttest": 8.18,
    "student-pb-16:act-pretest": 9.09,
    "student-pb-17:act-pretest": 7.27,
    "student-pb-17:act-posttest": 9.09,
    "student-pb-18:act-pretest": 4.55,
    "student-pb-18:act-posttest": 7.27,
    "student-pb-19:act-pretest": 5.45,
    "student-pb-19:act-posttest": 4.55,
    "student-pb-20:act-pretest": 7.27,
    "student-pb-20:act-posttest": 8.18,
    "student-pb-21:act-pretest": 5.45,
    "student-pb-22:act-pretest": 10,
    "student-pb-22:act-posttest": 10,
    "student-pb-23:act-pretest": 5.45,
    "student-pb-23:act-posttest": 5.45,
    "student-pb-24:act-pretest": 7.27,
    "student-pb-24:act-posttest": 7.27,
    "student-pb-25:act-pretest": 4.55,
    "student-pb-26:act-pretest": 9.09,
    "student-pb-26:act-posttest": 7.27,
    "student-pb-27:act-pretest": 8.18,
    "student-pb-27:act-posttest": 6.36,
    "student-pb-28:act-pretest": 5.45,
    "student-pb-28:act-posttest": 5.45,
    "student-pb-29:act-pretest": 7.27,
    "student-pb-29:act-posttest": 5.45,
    "student-pb-30:act-pretest": 7.27,
    "student-pb-30:act-posttest": 8.18,
    "student-pb-32:act-posttest": 7.27,
    "student-pb-33:act-pretest": 4.55,
    "student-pb-33:act-posttest": 7.27,
    "student-pb-34:act-pretest": 3.64,
    "student-pb-34:act-posttest": 6.36,
    "student-pb-35:act-pretest": 6.36,
    "student-pb-35:act-posttest": 8.18,
    "student-pb-36:act-pretest": 9.09,
    "student-pb-36:act-posttest": 10,
    "student-pb-38:act-pretest": 6.36,
    "student-pb-39:act-pretest": 6.36,
    "student-pb-40:act-pretest": 6.36,
    "student-pb-40:act-posttest": 4.55,
    "student-pb-41:act-pretest": 4.55,
    "student-pb-41:act-posttest": 7.27
  },
  "diagnosticTests": {
    "maxScore": 10,
    "courseInfo": {
      "institution": "UNIDAD EDUCATIVA ENRIQUE LOPEZ LASCANO - 09H04773",
      "period": "2025 - 2026",
      "parallel": "PARALELO B",
      "course": "Pensamiento Computacional PAOI 2026"
    },
    "scores": {
      "student-pb-01": {
        "pre": 3.64,
        "post": 4.55,
        "preAnswers": {
          "P4": "A",
          "P5": "A",
          "P6": "C",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "NR",
          "P2": "NR",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "NR",
          "P2": "NO",
          "P3": "SI"
        }
      },
      "student-pb-02": {
        "pre": 7.27,
        "post": 4.55,
        "preAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "A",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "A",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "C",
          "P14": "A"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-03": {
        "pre": 7.27,
        "post": null,
        "preAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-04": {
        "pre": 5.45,
        "post": null,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "A",
          "P8": "C",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-05": {
        "pre": 9.09,
        "post": 7.27,
        "preAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "A",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "NO"
        }
      },
      "student-pb-06": {
        "pre": 7.27,
        "post": 6.36,
        "preAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "C",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "C",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "C",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "SI"
        }
      },
      "student-pb-07": {
        "pre": 3.64,
        "post": 3.64,
        "preAnswers": {
          "P4": "B",
          "P5": "A",
          "P6": "C",
          "P7": "A",
          "P8": "C",
          "P9": "C",
          "P10": "B",
          "P11": "C",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "A",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "C",
          "P10": "A",
          "P11": "A",
          "P12": "B",
          "P13": "C",
          "P14": "D"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        }
      },
      "student-pb-08": {
        "pre": 6.36,
        "post": 8.18,
        "preAnswers": {
          "P4": "B",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "A",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        }
      },
      "student-pb-09": {
        "pre": 6.36,
        "post": 5.45,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "A",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "E",
          "P6": "C",
          "P7": "A",
          "P8": "A",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-10": {
        "pre": 7.27,
        "post": 5.45,
        "preAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "SI"
        }
      },
      "student-pb-11": {
        "pre": 7.27,
        "post": 5.45,
        "preAnswers": {
          "P4": "-",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "A"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-12": {
        "pre": 3.64,
        "post": 3.64,
        "preAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "A",
          "P7": "A",
          "P8": "C",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "A",
          "P7": "A",
          "P8": "A",
          "P9": "C",
          "P10": "A",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        }
      },
      "student-pb-13": {
        "pre": 5.45,
        "post": 7.27,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "C",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "C",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-14": {
        "pre": 5.45,
        "post": 3.64,
        "preAnswers": {
          "P4": "C",
          "P5": "E",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "-",
          "P10": "A",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "A"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        }
      },
      "student-pb-15": {
        "pre": 8.18,
        "post": 8.18,
        "preAnswers": {
          "P4": "D",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-16": {
        "pre": 9.09,
        "post": null,
        "preAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-17": {
        "pre": 7.27,
        "post": 9.09,
        "preAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "-",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-18": {
        "pre": 4.55,
        "post": 7.27,
        "preAnswers": {
          "P4": "C",
          "P5": "E",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "D",
          "P10": "C",
          "P11": "C",
          "P12": "B",
          "P13": "C",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-19": {
        "pre": 5.45,
        "post": 4.55,
        "preAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "C",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "D",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "D",
          "P14": "B"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "SI",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-20": {
        "pre": 7.27,
        "post": 8.18,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "NO"
        }
      },
      "student-pb-21": {
        "pre": 5.45,
        "post": null,
        "preAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "A",
          "P9": "-",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-22": {
        "pre": 10,
        "post": 10,
        "preAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "MM"
        }
      },
      "student-pb-23": {
        "pre": 5.45,
        "post": 5.45,
        "preAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "B",
          "P7": "B",
          "P8": "A",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "B",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "SI"
        }
      },
      "student-pb-24": {
        "pre": 7.27,
        "post": 7.27,
        "preAnswers": {
          "P4": "B",
          "P5": "A",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NS",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-25": {
        "pre": 4.55,
        "post": null,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "C",
          "P7": "C",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "D",
          "P14": "B"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-26": {
        "pre": 9.09,
        "post": 7.27,
        "preAnswers": {
          "P4": "-",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "MM"
        }
      },
      "student-pb-27": {
        "pre": 8.18,
        "post": 6.36,
        "preAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "D",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "A",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "MM"
        }
      },
      "student-pb-28": {
        "pre": 5.45,
        "post": 5.45,
        "preAnswers": {
          "P4": "B",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "C",
          "P9": "B",
          "P10": "A",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "B",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "C",
          "P9": "-",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-29": {
        "pre": 7.27,
        "post": 5.45,
        "preAnswers": {
          "P4": "C",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "D",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "A",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "C",
          "P14": "D"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NR",
          "P2": "NR",
          "P3": "SI"
        }
      },
      "student-pb-30": {
        "pre": 7.27,
        "post": 8.18,
        "preAnswers": {
          "P4": "C",
          "P5": "E",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "postAnswers": {
          "P4": "E",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "C",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "MM"
        }
      },
      "student-pb-31": {
        "pre": null,
        "post": null,
        "preAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-32": {
        "pre": null,
        "post": 7.27,
        "preAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "A",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "A",
          "P14": "D"
        },
        "prePerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "SI"
        }
      },
      "student-pb-33": {
        "pre": 4.55,
        "post": 7.27,
        "preAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "A",
          "P7": "A",
          "P8": "B",
          "P9": "C",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "B",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "NO"
        }
      },
      "student-pb-34": {
        "pre": 3.64,
        "post": 6.36,
        "preAnswers": {
          "P4": "A",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "A",
          "P9": "A",
          "P10": "A",
          "P11": "B",
          "P12": "B",
          "P13": "D",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "-",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "D",
          "P14": "A"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "MM",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-35": {
        "pre": 6.36,
        "post": 8.18,
        "preAnswers": {
          "P4": "C",
          "P5": "A",
          "P6": "C",
          "P7": "B",
          "P8": "A",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "D",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "A",
          "P14": "C"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "NO"
        }
      },
      "student-pb-36": {
        "pre": 9.09,
        "post": 10,
        "preAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "A",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "C"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "NO"
        }
      },
      "student-pb-37": {
        "pre": null,
        "post": null,
        "preAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-38": {
        "pre": 6.36,
        "post": null,
        "preAnswers": {
          "P4": "C",
          "P5": "A",
          "P6": "C",
          "P7": "B",
          "P8": "A",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "D",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "MM",
          "P3": "SI"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-39": {
        "pre": 6.36,
        "post": null,
        "preAnswers": {
          "P4": "E",
          "P5": "B",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "D"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "NS",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      },
      "student-pb-40": {
        "pre": 6.36,
        "post": 4.55,
        "preAnswers": {
          "P4": "D",
          "P5": "D",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "B",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "B",
          "P6": "C",
          "P7": "A",
          "P8": "A",
          "P9": "D",
          "P10": "B",
          "P11": "-",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "NO",
          "P2": "NO",
          "P3": "NO"
        },
        "postPerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "SI"
        }
      },
      "student-pb-41": {
        "pre": 4.55,
        "post": 7.27,
        "preAnswers": {
          "P4": "E",
          "P5": "E",
          "P6": "B",
          "P7": "A",
          "P8": "C",
          "P9": "B",
          "P10": "B",
          "P11": "A",
          "P12": "-",
          "P13": "B",
          "P14": "C"
        },
        "postAnswers": {
          "P4": "C",
          "P5": "C",
          "P6": "C",
          "P7": "B",
          "P8": "B",
          "P9": "D",
          "P10": "-",
          "P11": "A",
          "P12": "B",
          "P13": "B",
          "P14": "B"
        },
        "prePerception": {
          "P1": "SI",
          "P2": "SI",
          "P3": "MM"
        },
        "postPerception": {
          "P1": "NR",
          "P2": "NR",
          "P3": "SI"
        }
      },
      "student-pb-42": {
        "pre": null,
        "post": null,
        "preAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "postAnswers": {
          "P4": "-",
          "P5": "-",
          "P6": "-",
          "P7": "-",
          "P8": "-",
          "P9": "-",
          "P10": "-",
          "P11": "-",
          "P12": "-",
          "P13": "-",
          "P14": "-"
        },
        "prePerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        },
        "postPerception": {
          "P1": "-",
          "P2": "-",
          "P3": "-"
        }
      }
    }
  }
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function normalizeData(value) {
  const input = value && typeof value === 'object' ? value : {};

  const classesSource = Array.isArray(input.classes)
    ? input.classes
    : defaultData.classes;

  const classes = classesSource.map((classItem, index) => ({
    id: String(classItem?.id || `class-${index + 1}`),
    name: String(classItem?.name || `Clase ${index + 1}`),
    code: String(classItem?.code || `PARALELO ${index + 1}`),
    term: String(classItem?.term || 'I PAO 2026'),
    color: String(classItem?.color || defaultColors[index % defaultColors.length]),
    activities: Array.isArray(classItem?.activities)
      ? classItem.activities.map((act, actIndex) => ({
          id: String(act?.id || `activity-${index + 1}-${actIndex + 1}`),
          name: String(act?.name || `Actividad ${actIndex + 1}`),
          maxScore: Number.isFinite(Number(act?.maxScore)) && Number(act?.maxScore) >= 0 ? Number(act?.maxScore) : 0
        }))
      : []
  }));

  const students = Array.isArray(input.students)
    ? input.students.map((student, index) => ({
        id: String(student?.id || `student-${index + 1}`),
        name: String(student?.name || `Estudiante ${index + 1}`),
        num: student?.num ? Number(student.num) : (index + 1),
        cedula: student?.cedula ? String(student.cedula) : '',
        email: student?.email ? String(student.email) : ''
      }))
    : [];

  const selectedClassId = classes.some((item) => item.id === input.selectedClassId)
    ? input.selectedClassId
    : classes[0]?.id ?? null;

  const grades = input.grades && typeof input.grades === 'object' && !Array.isArray(input.grades)
    ? { ...input.grades }
    : {};

  const rawDiag = input.diagnosticTests && typeof input.diagnosticTests === 'object'
    ? input.diagnosticTests
    : {};
  const diagMax = Number(rawDiag.maxScore);
  const validDiagMax = Number.isFinite(diagMax) && diagMax > 0 ? diagMax : 10;
  const diagScores = rawDiag.scores && typeof rawDiag.scores === 'object' ? rawDiag.scores : {};
  const courseInfo = rawDiag.courseInfo && typeof rawDiag.courseInfo === 'object' ? rawDiag.courseInfo : null;

  return {
    selectedClassId,
    classes,
    students,
    grades,
    diagnosticTests: {
      maxScore: validDiagMax,
      courseInfo,
      scores: diagScores
    }
  };
}

async function ensureDatabase() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, 'utf8');
  } catch {
    await writeDatabase(defaultData);
  }
}

async function readDatabase() {
  await ensureDatabase();
  try {
    const content = await readFile(DB_FILE, 'utf8');
    return normalizeData(JSON.parse(content));
  } catch {
    return defaultData;
  }
}

async function writeDatabase(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, `${JSON.stringify(normalizeData(data), null, 2)}\n`, 'utf8');
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error('El cuerpo de la petición es demasiado grande.'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function handleApi(request, response) {
  const parsed = new URL(request.url, 'http://localhost');
  if (parsed.pathname === '/api/data' && request.method === 'GET') {
    sendJson(response, 200, await readDatabase());
    return true;
  }

  if (parsed.pathname === '/api/data' && request.method === 'PUT') {
    const body = await readRequestBody(request);
    const data = JSON.parse(body || '{}');
    await writeDatabase(data);
    sendJson(response, 200, await readDatabase());
    return true;
  }

  if (parsed.pathname === '/api/test-results' && request.method === 'GET') {
    try {
      const content = await readFile(path.join(DATA_DIR, 'test_results_paralelo_b.json'), 'utf8');
      sendJson(response, 200, JSON.parse(content));
      return true;
    } catch {
      sendJson(response, 404, { error: 'No se encontraron resultados del test' });
      return true;
    }
  }

  return false;
}

function safeStaticPath(url) {
  const parsed = new URL(url, 'http://localhost');
  let pathname = parsed.pathname;

  // Clean duplicate subpaths
  while (pathname.includes('/paginas/paginas')) {
    pathname = pathname.replace('/paginas/paginas', '/paginas');
  }

  // Common aliases for Tablero / Home
  if (pathname === '/' || pathname === '/index.html' || pathname === '/tablero' || pathname === '/paginas/index.html' || pathname === '/paginas/' || pathname === '/paginas') {
    return path.join(PUBLIC_DIR, 'paginas', 'index.html');
  }

  // Common aliases for Estudiantes
  if (pathname === '/estudiantes' || pathname === '/estudiantes.html' || pathname === '/paginas/estudiantes.html' || pathname === '/paginas/estudiantes') {
    return path.join(PUBLIC_DIR, 'paginas', 'estudiantes.html');
  }

  // Common aliases for Dashboard
  if (pathname === '/dashboard' || pathname === '/dashboard.html' || pathname === '/paginas/dashboard.html' || pathname === '/paginas/dashboard') {
    return path.join(PUBLIC_DIR, 'paginas', 'dashboard.html');
  }

  // Common aliases for Clase
  if (pathname === '/clase' || pathname === '/clase.html' || pathname === '/paginas/clase.html' || pathname === '/paginas/clase') {
    return path.join(PUBLIC_DIR, 'paginas', 'clase.html');
  }

  // Common aliases for Informe de Resultados
  if (pathname === '/informe-resultados' || pathname === '/informe-resultados.html' || pathname === '/paginas/informe-resultados.html' || pathname === '/paginas/informe-resultados') {
    return path.join(PUBLIC_DIR, 'paginas', 'informe-resultados.html');
  }

  // Direct file requests
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (filePath.startsWith(PUBLIC_DIR)) {
    return filePath;
  }

  return null;
}

async function serveStatic(request, response) {
  const filePath = safeStaticPath(request.url);
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
    return;
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) throw new Error('No es un archivo');
  } catch {
    // If not found in root, try looking in paginas
    try {
      const fallbackPath = path.join(PUBLIC_DIR, 'paginas', path.basename(filePath));
      const fbStats = await stat(fallbackPath);
      if (fbStats.isFile()) {
        const ext = path.extname(fallbackPath);
        response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        createReadStream(fallbackPath).pipe(response);
        return;
      }
    } catch {}

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
    return;
  }

  const extension = path.extname(filePath);
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  createReadStream(filePath)
    .on('error', () => {
      if (!response.headersSent) response.writeHead(404);
      response.end('Archivo no encontrado');
    })
    .pipe(response);
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      if (await handleApi(request, response)) return;
      await serveStatic(request, response);
    } catch (error) {
      sendJson(response, 500, { error: error.message || 'Error interno del servidor' });
    }
  });
}

const server = createServer();
server.listen(PORT, () => {
  console.log(`Servidor local disponible en http://localhost:${PORT}`);
});
