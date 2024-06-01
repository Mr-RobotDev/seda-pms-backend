import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card } from './schema/card.schema';
import { DashboardService } from '../dashboard/dashboard.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<Card>,
    private readonly dashboardService: DashboardService,
  ) {}

  async createCard(dashboard: string, createCardDto: CreateCardDto) {
    const newCard = await this.cardModel.create({
      ...createCardDto,
      dashboard,
    });
    await this.dashboardService.updateDashboard(dashboard, {
      $inc: {
        cardsCount: 1,
        devicesCount: createCardDto.devices.length,
      },
    });
    const card = await this.card(dashboard, newCard.id);
    return card;
  }

  cards(dashboard: string) {
    return this.cardModel.find(
      {
        dashboard,
      },
      '-createdAt -dashboard',
      {
        populate: {
          path: 'devices',
          select: 'name oem',
        },
      },
    );
  }

  async card(dashboard: string, id: string) {
    const card = await this.cardModel.findOne(
      {
        _id: id,
        dashboard,
      },
      '-createdAt -dashboard',
      {
        populate: {
          path: 'devices',
          select: 'name oem',
        },
      },
    );
    if (!card) {
      throw new NotFoundException(`Card #${id} not found`);
    }
    return card;
  }

  async updateCard(
    dashboard: string,
    id: string,
    updateCardDto: UpdateCardDto,
  ) {
    const card = await this.cardModel.findOneAndUpdate(
      {
        _id: id,
        dashboard,
      },
      updateCardDto,
      {
        new: true,
        projection: '-createdAt -dashboard',
      },
    );
    if (!card) {
      throw new NotFoundException(`Card #${id} not found`);
    }
    return card;
  }

  async removeCard(dashboard: string, id: string) {
    const card = await this.cardModel.findOneAndDelete(
      {
        _id: id,
        dashboard,
      },
      {
        projection: '-createdAt -dashboard',
      },
    );
    if (!card) {
      throw new NotFoundException(`Card #${id} not found`);
    }
    await this.dashboardService.updateDashboard(dashboard, {
      $inc: {
        cardsCount: -1,
        devicesCount: -card.devices.length,
      },
    });
    return card;
  }
}
