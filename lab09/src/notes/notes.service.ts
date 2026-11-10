import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SortOrder } from '../common/pipes/sort-order.pipe';

@Injectable()
export class NotesService {
  private notes: Note[] = [
    {
      id: 1,
      title: 'Design Meeting',
      content: 'Discuss system architecture and requirements.',
      tags: ['meeting', 'architecture'],
      userId: 2, // Owned by Alice (user id: 2)
    },
    {
      id: 2,
      title: 'Backend Roadmap',
      content: 'Plan NestJS modules, pipes, and guards.',
      tags: ['planning', 'nestjs'],
      userId: 2,
    },
    {
      id: 3,
      title: 'API Security Checklist',
      content: 'Review helmet, CORS, and DTO validation.',
      tags: ['security', 'audit'],
      userId: 2,
    },
  ];

  private nextId = 4;

  findAll(userId: number, order: SortOrder = 'asc'): Note[] {
    const userNotes = this.notes.filter((note) => note.userId === userId);
    return [...userNotes].sort((a, b) => {
      const cmp = a.title.localeCompare(b.title);
      return order === 'desc' ? -cmp : cmp;
    });
  }

  findById(id: number): Note {
    const note = this.notes.find((n) => n.id === id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  create(dto: CreateNoteDto, userId: number): Note {
    const newNote: Note = {
      id: this.nextId++,
      title: dto.title,
      content: dto.content,
      tags: dto.tags ?? [],
      userId,
    };
    this.notes.push(newNote);
    return newNote;
  }

  update(
    id: number,
    dto: UpdateNoteDto,
    currentUser: { sub: number; role: string },
  ): Note {
    const note = this.findById(id);

    if (note.userId !== currentUser.sub && currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to update this note',
      );
    }

    if (dto.title !== undefined) {
      note.title = dto.title;
    }
    if (dto.content !== undefined) {
      note.content = dto.content;
    }
    if (dto.tags !== undefined) {
      note.tags = dto.tags;
    }

    return note;
  }
}
