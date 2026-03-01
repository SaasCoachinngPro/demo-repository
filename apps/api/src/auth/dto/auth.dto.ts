import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserRole {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
}

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsString()
    phone?: string;

    // Student-specific
    @IsOptional()
    @IsString()
    class?: string;

    @IsOptional()
    @IsString()
    batch?: string;

    @IsOptional()
    @IsString()
    parentPhone?: string;

    // Teacher-specific
    @IsOptional()
    subjects?: string[];

    @IsOptional()
    classes?: string[];

    @IsOptional()
    @IsString()
    qualification?: string;

    // Parent-specific
    @IsOptional()
    studentIds?: string[];
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}
