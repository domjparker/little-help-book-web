﻿
using System;
using System.Collections.Generic;
using System.Linq;
using AirtableApiClient;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using EugeneFoodScene.Services;
using GoogleMapsComponents.Maps;
using LittleHelpBook.Server.Services;
using LittleHelpBook.Shared.Data;

namespace EugeneFoodScene.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CategoryController : ControllerBase
    {
     
        private readonly ILogger<HelpController> logger;
        private readonly AirTableService _airTableService;

        public CategoryController(ILogger<HelpController> logger, AirTableService airTableService)
        {
            this.logger = logger;
            _airTableService = airTableService;
        }

        [HttpGet]
        public async Task<IEnumerable<Category>> Get()
        {

            var data = await _airTableService.GetCategoriesAsync();

            return data.ToArray();

        }

    }
}